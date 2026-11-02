import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import type { ApiErrorBody } from '@icommunicate/shared';
import { config } from '../../config';
import { AppError } from '../../utils/AppError';

const toMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

function toHttpError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) return { status: error.status, message: error.message };
  if (error instanceof multer.MulterError) {
    return error.code === 'LIMIT_FILE_SIZE'
      ? { status: 413, message: `Files are limited to ${toMb(config.maxFileSizeBytes)} MB` }
      : { status: 400, message: error.message };
  }
  const status = (error as { status?: unknown })?.status;
  if (typeof status === 'number' && status < 500) return { status, message: (error as Error).message };
  return { status: 500, message: 'Internal server error' };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const { status, message } = toHttpError(error);
  if (status >= 500) console.error(error);
  if (res.headersSent) return;
  res.status(status).json({ error: message } satisfies ApiErrorBody);
};
