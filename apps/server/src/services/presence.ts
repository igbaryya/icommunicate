import type { Device } from '@icommunicate/shared';
import type { DeviceRecord } from '../repositories/devices';

const socketsByDevice = new Map<string, Set<string>>();

export const presenceService = {
  /** Returns true when the device just came online. */
  connect(deviceId: string, socketId: string) {
    const sockets = socketsByDevice.get(deviceId) ?? new Set<string>();
    sockets.add(socketId);
    socketsByDevice.set(deviceId, sockets);
    return sockets.size === 1;
  },

  /** Returns true when the device just went offline. */
  disconnect(deviceId: string, socketId: string) {
    const sockets = socketsByDevice.get(deviceId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size) return false;
    socketsByDevice.delete(deviceId);
    return true;
  },

  isOnline: (deviceId: string) => socketsByDevice.has(deviceId),

  toDevice: (record: DeviceRecord): Device => ({ ...record, online: socketsByDevice.has(record.id) }),
};
