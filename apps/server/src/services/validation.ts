import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_DEVICE_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  type OpenDmPayload,
  type RenameDevicePayload,
  type SendMessagePayload,
} from '@icommunicate/shared';
import { AppError } from '../utils/AppError';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const requireString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !value) throw new AppError(400, `"${field}" is required`);
  return value;
};

export function parseSendMessage(payload: unknown): SendMessagePayload {
  if (!isRecord(payload)) throw new AppError(400, 'Invalid payload');

  const conversationId = requireString(payload.conversationId, 'conversationId');
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const attachmentIds = Array.isArray(payload.attachmentIds)
    ? [...new Set(payload.attachmentIds.filter((id): id is string => typeof id === 'string'))]
    : [];

  if (body.length > MAX_MESSAGE_LENGTH) throw new AppError(400, `Messages are limited to ${MAX_MESSAGE_LENGTH} characters`);
  if (attachmentIds.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new AppError(400, `A message can carry up to ${MAX_ATTACHMENTS_PER_MESSAGE} attachments`);
  }
  if (!body && !attachmentIds.length) throw new AppError(400, 'Message is empty');

  return { conversationId, body, attachmentIds };
}

export function parseOpenDm(payload: unknown): OpenDmPayload {
  if (!isRecord(payload)) throw new AppError(400, 'Invalid payload');
  return { deviceId: requireString(payload.deviceId, 'deviceId') };
}

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/** The caller is the only machine this name can be applied to. */
export function parseRename(payload: unknown): RenameDevicePayload {
  if (!isRecord(payload)) throw new AppError(400, 'Invalid payload');
  const hostname = requireString(payload.hostname, 'hostname').trim();
  if (!hostname) throw new AppError(400, 'Name is required');
  if (hostname.length > MAX_DEVICE_NAME_LENGTH) {
    throw new AppError(400, `Names are limited to ${MAX_DEVICE_NAME_LENGTH} characters`);
  }
  if (CONTROL_CHARS.test(hostname)) throw new AppError(400, 'Name contains invalid characters');
  return { hostname };
}
