import os from 'node:os';

const LOOPBACK_IP = '127.0.0.1';

/** Overlay and virtual adapters must not become the machine's identity. */
const VIRTUAL_INTERFACE = /tailscale|wsl|vethernet|hyper-v|docker|virtualbox|vmware|vbox|bluetooth|zerotier|wireguard|vpn/i;

interface HostAddress {
  name: string;
  address: string;
}

export function normalizeIp(ip: string | undefined | null) {
  if (!ip) return '';
  const value = ip.trim();
  if (value === '::1') return LOOPBACK_IP;
  return value.startsWith('::ffff:') ? value.slice(7) : value;
}

export const isLoopback = (ip: string) => ip.startsWith('127.');

export function isPrivateIp(ip: string) {
  if (isLoopback(ip)) return true;

  const octets = ip.split('.').map(Number);
  if (octets.length === 4 && octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = octets as [number, number, number, number];
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  }

  const lower = ip.toLowerCase();
  return lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd');
}

/**
 * X-Forwarded-For is trusted only from loopback, i.e. the Vite dev proxy on this machine.
 */
export function resolveClientIp(remoteAddress: string | undefined, forwardedFor: string | string[] | undefined) {
  const remote = normalizeIp(remoteAddress);
  if (!isLoopback(remote) || !forwardedFor) return remote;

  const header = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return normalizeIp(header?.split(',')[0]) || remote;
}

/** 100.64.0.0/10 — Tailscale and other overlays, not a LAN the other machines share. */
function isCgnat(ip: string) {
  const [a, b] = ip.split('.').map(Number);
  return a === 100 && b !== undefined && b >= 64 && b <= 127;
}

function rankHostAddress(name: string, address: string) {
  let rank = 0;
  if (VIRTUAL_INTERFACE.test(name) || isCgnat(address)) rank += 100;
  if (!isPrivateIp(address)) rank += 50;
  return rank;
}

/** Every non-loopback IPv4 on this machine, real LAN addresses first. Order is stable across restarts. */
function listHostAddresses(): HostAddress[] {
  return Object.entries(os.networkInterfaces())
    .flatMap(([name, infos]) =>
      (infos ?? [])
        .filter((info) => info.family === 'IPv4' && !info.internal)
        .map((info) => ({ name, address: info.address })),
    )
    .sort(
      (a, b) =>
        rankHostAddress(a.name, a.address) - rankHostAddress(b.name, b.address) ||
        a.address.localeCompare(b.address),
    );
}

export const getHostAddresses = () => listHostAddresses().map((entry) => entry.address);

/** Addresses other machines on the LAN can open. Virtual and overlay adapters are left out. */
export function getLanAddresses() {
  const host = listHostAddresses();
  const lan = host.filter((entry) => rankHostAddress(entry.name, entry.address) === 0);
  return (lan.length ? lan : host).map((entry) => entry.address);
}

export const isHostIp = (ip: string) => isLoopback(ip) || getHostAddresses().includes(ip);

/** Every address of the host machine maps to one device: its preferred LAN address. */
export function toCanonicalIp(ip: string) {
  if (!isHostIp(ip)) return ip;
  return getLanAddresses()[0] ?? LOOPBACK_IP;
}
