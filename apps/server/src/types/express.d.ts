import type { DeviceRecord } from '../repositories/devices';

declare global {
  namespace Express {
    interface Request {
      clientIp: string;
      device: DeviceRecord;
    }
  }
}

export {};
