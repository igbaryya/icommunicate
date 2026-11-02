import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { API_PREFIX } from '@icommunicate/shared';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { attachDevice } from './middleware/attachDevice';
import { errorHandler } from './middleware/errorHandler';
import { lanOnly } from './middleware/lanOnly';
import { attachmentsRouter } from './routes/attachments';
import { conversationsRouter } from './routes/conversations';
import { devicesRouter } from './routes/devices';
import { systemRouter } from './routes/system';

function createApiRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '100kb' }), attachDevice);
  router.use('/', systemRouter);
  router.use('/devices', devicesRouter);
  router.use('/conversations', conversationsRouter);
  router.use('/attachments', attachmentsRouter);
  router.use(() => {
    throw new AppError(404, 'Not found');
  });
  return router;
}

function serveClient(app: express.Express) {
  const indexFile = path.join(config.paths.clientDist, 'index.html');
  if (!fs.existsSync(indexFile)) return;

  app.use(express.static(config.paths.clientDist, { index: false }));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(indexFile) : next()));
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(lanOnly);
  app.use(API_PREFIX, createApiRouter());
  serveClient(app);
  app.use(errorHandler);
  return app;
}
