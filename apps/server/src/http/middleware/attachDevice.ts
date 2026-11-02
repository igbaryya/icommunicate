import type { RequestHandler } from 'express';
import { identityService } from '../../services/identity';

export const attachDevice: RequestHandler = async (req, _res, next) => {
  req.device = await identityService.identify(req.clientIp);
  next();
};
