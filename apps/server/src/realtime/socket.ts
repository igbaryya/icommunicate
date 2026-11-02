import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import {
  SocketEvent,
  type Ack,
  type ClientToServerEvents,
  type Conversation,
  type ServerToClientEvents,
} from '@icommunicate/shared';
import { config } from '../config';
import { devicesRepository, type DeviceRecord } from '../repositories/devices';
import { chatService } from '../services/chat';
import { identityService } from '../services/identity';
import { presenceService } from '../services/presence';
import { parseRename } from '../services/validation';
import { AppError } from '../utils/AppError';
import { isPrivateIp, resolveClientIp } from '../utils/network';

interface SocketData {
  device: DeviceRecord;
}

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const EVERYONE_ROOM = 'everyone';
const deviceRoom = (deviceId: string) => `device:${deviceId}`;

function withAck<R>(handler: (payload: unknown) => R) {
  return (payload: unknown, ack: (res: Ack<R>) => void) => {
    if (typeof ack !== 'function') return;
    try {
      ack({ ok: true, data: handler(payload) });
    } catch (error) {
      if (!(error instanceof AppError)) console.error(error);
      ack({ ok: false, error: error instanceof AppError ? error.message : 'Unexpected server error' });
    }
  };
}

export function createRealtimeServer(httpServer: HttpServer) {
  const io: IoServer = new Server(httpServer, { serveClient: false, maxHttpBufferSize: 1e6 });

  const audience = (conversation: Conversation) =>
    io.to(conversation.type === 'channel' ? EVERYONE_ROOM : conversation.memberIds.map(deviceRoom));

  const broadcastDevice = (deviceId: string) => {
    const record = devicesRepository.findById(deviceId);
    if (record) io.emit(SocketEvent.DeviceUpsert, presenceService.toDevice(record));
  };

  io.use(async (socket, next) => {
    const ip = resolveClientIp(socket.handshake.address, socket.handshake.headers['x-forwarded-for']);
    if (config.lanOnly && !isPrivateIp(ip)) return next(new Error('Only clients on the local network are allowed'));
    try {
      socket.data.device = await identityService.identify(ip);
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  io.on('connection', (socket: IoSocket) => {
    const deviceId = socket.data.device.id;
    socket.join([EVERYONE_ROOM, deviceRoom(deviceId)]);

    if (presenceService.connect(deviceId, socket.id)) broadcastDevice(deviceId);

    identityService
      .refreshHostname(socket.data.device)
      .then((updated) => updated && broadcastDevice(updated.id))
      .catch(() => undefined);

    socket.on(
      SocketEvent.MessageSend,
      withAck((payload) => {
        const { conversation, message } = chatService.sendMessage(deviceId, payload);
        audience(conversation).emit(SocketEvent.MessageNew, message);
        return message;
      }),
    );

    socket.on(
      SocketEvent.ConversationOpenDm,
      withAck((payload) => {
        const { conversation, created } = chatService.openDm(deviceId, payload);
        if (created) audience(conversation).emit(SocketEvent.ConversationUpsert, conversation);
        return conversation;
      }),
    );

    socket.on(
      SocketEvent.DeviceRename,
      withAck((payload) => {
        const { hostname } = parseRename(payload);
        const device = identityService.rename(socket.data.device, hostname);
        socket.data.device = device;
        broadcastDevice(device.id);
        return presenceService.toDevice(device);
      }),
    );

    socket.on('disconnect', () => {
      if (!presenceService.disconnect(deviceId, socket.id)) return;
      devicesRepository.touch(deviceId);
      broadcastDevice(deviceId);
    });
  });

  return io;
}
