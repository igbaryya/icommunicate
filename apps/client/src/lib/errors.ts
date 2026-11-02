import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ApiErrorBody } from '@icommunicate/shared';

const isApiErrorBody = (data: unknown): data is ApiErrorBody =>
  typeof data === 'object' && data !== null && typeof (data as ApiErrorBody).error === 'string';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (!error || typeof error !== 'object') return fallback;
  const fetchError = error as FetchBaseQueryError;
  if ('status' in fetchError) {
    if ('error' in fetchError) return fetchError.error;
    if (isApiErrorBody(fetchError.data)) return fetchError.data.error;
    return fallback;
  }
  return (error as SerializedError | Error).message ?? fallback;
}
