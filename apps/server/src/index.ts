import http from 'node:http';
import { config } from './config';
import { db } from './db';
import { createApp } from './http/app';
import { createRealtimeServer } from './realtime/socket';
import { startOrphanCleanup } from './services/cleanup';
import { storageService } from './services/storage';
import { identityService } from './services/identity';
import { getLanAddresses } from './utils/network';

storageService.ensureRoot();
identityService.reconcileHost();

const server = http.createServer(createApp());
const io = createRealtimeServer(server);
startOrphanCleanup();

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') console.error(`Port ${config.port} is already in use. Set PORT in .env.`);
  else console.error(error);
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  const urls = getLanAddresses().map((address) => `  http://${address}:${config.port}`);
  console.log(
    [
      `iCommunicate LAN server is running`,
      `  http://localhost:${config.port}`,
      ...urls,
      `Storage: ${config.paths.storage}`,
    ].join('\n'),
  );
});

function shutdown() {
  io.close();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
