import type { ApiErrorBody } from '@icommunicate/shared';

export class TransferError extends Error {
  constructor(
    message: string,
    public readonly cancelled = false,
  ) {
    super(message);
  }
}

interface TransferOptions {
  method: 'GET' | 'POST';
  url: string;
  body?: XMLHttpRequestBodyInit;
  responseType?: XMLHttpRequestResponseType;
  /** Used when the server does not send Content-Length. */
  totalBytes?: number;
  onProgress?: (fraction: number) => void;
}

export interface Transfer<T> {
  promise: Promise<T>;
  abort: () => void;
}

/** XHR is used instead of fetch because fetch exposes no upload progress. */
export function transfer<T>({ method, url, body, responseType = 'json', totalBytes, onProgress }: TransferOptions): Transfer<T> {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<T>((resolve, reject) => {
    xhr.open(method, url);
    xhr.responseType = responseType;

    const progressTarget = method === 'GET' ? xhr : xhr.upload;
    progressTarget.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : totalBytes;
      if (total) onProgress?.(Math.min(event.loaded / total, 1));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.response as T);
      const message = responseType === 'json' ? (xhr.response as ApiErrorBody | null)?.error : undefined;
      reject(new TransferError(message ?? `Transfer failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new TransferError('Network error, check the connection to the LAN server'));
    xhr.onabort = () => reject(new TransferError('Transfer cancelled', true));

    xhr.send(body ?? null);
  });

  return { promise, abort: () => xhr.abort() };
}
