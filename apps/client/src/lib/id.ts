let counter = 0;

/** `crypto.randomUUID` is unavailable over plain http on LAN IPs (not a secure context). */
export const createLocalId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;
