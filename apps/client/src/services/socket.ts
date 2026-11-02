import { io, type Socket } from 'socket.io-client';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type {
  Ack,
  AckEventName,
  AckPayload,
  AckResult,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@icommunicate/shared';

const ACK_TIMEOUT_MS = 10_000;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});

/** Socket request/acknowledge exposed in RTK Query `queryFn` shape. */
export async function emitWithAck<E extends AckEventName>(
  event: E,
  payload: AckPayload<E>,
): Promise<{ data: AckResult<E> } | { error: FetchBaseQueryError }> {
  if (!socket.connected) return { error: { status: 'CUSTOM_ERROR', error: 'Not connected to the LAN server' } };

  try {
    const res: Ack<AckResult<E>> = await (socket as unknown as Socket).timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload);
    return res.ok ? { data: res.data } : { error: { status: 'CUSTOM_ERROR', error: res.error } };
  } catch {
    return { error: { status: 'TIMEOUT_ERROR', error: 'The server did not respond in time' } };
  }
}
