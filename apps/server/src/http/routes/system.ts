import os from 'node:os';
import { Router } from 'express';
import type { ServerInfo, Session } from '@icommunicate/shared';
import { config } from '../../config';
import { presenceService } from '../../services/presence';
import { getLanAddresses } from '../../utils/network';

const startedAt = Date.now();

export const systemRouter = Router();

systemRouter.get('/info', (_req, res) => {
  res.json({
    hostname: os.hostname(),
    addresses: getLanAddresses(),
    port: config.port,
    startedAt,
    maxFileSizeBytes: config.maxFileSizeBytes,
  } satisfies ServerInfo);
});

systemRouter.get('/session', (req, res) => {
  res.json({ device: presenceService.toDevice(req.device) } satisfies Session);
});
