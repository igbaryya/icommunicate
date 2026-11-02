import dns from 'node:dns/promises';
import os from 'node:os';
import { devicesRepository, type DeviceRecord } from '../repositories/devices';
import { getHostAddresses, getLanAddresses, isHostIp, toCanonicalIp } from '../utils/network';

const LOOKUP_TIMEOUT_MS = 2000;

const inflight = new Map<string, Promise<DeviceRecord>>();

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Lookup timed out')), ms);
    timer.unref();
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/** Strips the DNS suffix (e.g. "PC-1.lan" -> "PC-1"); rejects results that are just the IP echoed back. */
function toShortName(name: string | undefined, ip: string) {
  const short = name?.split('.')[0]?.trim();
  return short && name !== ip && !/^\d+$/.test(short) ? short : null;
}

/**
 * Resolves a machine name from its IP: getnameinfo first (covers NetBIOS/LLMNR/mDNS on Windows),
 * then a DNS PTR lookup, finally falling back to the IP itself.
 */
async function resolveHostname(ip: string) {
  if (isHostIp(ip)) return os.hostname();

  try {
    const { hostname } = await withTimeout(dns.lookupService(ip, 0), LOOKUP_TIMEOUT_MS);
    const name = toShortName(hostname, ip);
    if (name) return name;
  } catch {
    // fall through to the next strategy
  }

  try {
    const [hostname] = await withTimeout(dns.reverse(ip), LOOKUP_TIMEOUT_MS);
    const name = toShortName(hostname, ip);
    if (name) return name;
  } catch {
    // fall through to the IP fallback
  }

  return ip;
}

export const identityService = {
  /**
   * NIC order changes between boots (a Tailscale or WSL adapter can sort first).
   * Collapse every address of this machine onto the preferred LAN device so history stays put.
   */
  reconcileHost() {
    const preferred = getLanAddresses()[0];
    if (!preferred) return;

    const localIps = new Set(getHostAddresses());
    const locals = devicesRepository.list().filter((device) => localIps.has(device.ip));
    const keeper =
      locals.find((device) => device.ip === preferred) ??
      locals.reduce<DeviceRecord | null>(
        (oldest, device) => (!oldest || device.firstSeenAt < oldest.firstSeenAt ? device : oldest),
        null,
      );
    if (!keeper) return;

    const duplicateIds = locals.filter((device) => device.id !== keeper.id).map((device) => device.id);
    if (keeper.ip === preferred && !duplicateIds.length) return;

    devicesRepository.adoptHost(keeper.id, preferred, duplicateIds);
    console.log(`This machine is ${preferred}${duplicateIds.length ? ` (merged ${duplicateIds.length} duplicate identity)` : ''}`);
  },

  identify(rawIp: string): Promise<DeviceRecord> {
    const ip = toCanonicalIp(rawIp);
    const existing = devicesRepository.findByIp(ip);
    if (existing) return Promise.resolve(existing);

    let pending = inflight.get(ip);
    if (!pending) {
      pending = resolveHostname(ip)
        .then((hostname) => devicesRepository.findByIp(ip) ?? devicesRepository.create(ip, hostname))
        .finally(() => inflight.delete(ip));
      inflight.set(ip, pending);
    }
    return pending;
  },

  /** Re-resolves the hostname; returns the updated record only when it changed. */
  async refreshHostname(device: DeviceRecord) {
    const hostname = await resolveHostname(device.ip);
    if (hostname === device.hostname || hostname === device.ip) return null;
    return devicesRepository.updateHostname(device.id, hostname);
  },
};
