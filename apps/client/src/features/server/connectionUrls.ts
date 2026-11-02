import type { ServerInfo } from '@icommunicate/shared';

/** Uses the port the browser is on, so the addresses are correct behind the Vite dev proxy too. */
export function getConnectionHosts(info: ServerInfo) {
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  return info.addresses.map((address) => `${address}:${port}`);
}

export const getConnectionUrls = (info: ServerInfo) =>
  getConnectionHosts(info).map((host) => `${window.location.protocol}//${host}`);
