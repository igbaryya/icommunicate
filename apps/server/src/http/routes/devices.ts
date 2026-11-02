import { Router } from 'express';
import type { Device } from '@icommunicate/shared';
import { devicesRepository } from '../../repositories/devices';
import { presenceService } from '../../services/presence';

export const devicesRouter = Router();

devicesRouter.get('/', (_req, res) => {
  res.json(devicesRepository.list().map(presenceService.toDevice) satisfies Device[]);
});
