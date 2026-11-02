import type { RequestHandler } from 'express';
import { config } from '../../config';
import { AppError } from '../../utils/AppError';
import { isPrivateIp, resolveClientIp } from '../../utils/network';

export const lanOnly: RequestHandler = (req, _res, next) => {
  req.clientIp = resolveClientIp(req.socket.remoteAddress, req.headers['x-forwarded-for']);
  if (config.lanOnly && !isPrivateIp(req.clientIp)) throw new AppError(403, 'Only clients on the local network are allowed');
  next();
};
