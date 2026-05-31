export const API_BASE_PATH = (import.meta.env.VITE_API_ORIGIN || '') + '/api/v1';
const DEFAULT_REQUEST_CREDENTIALS: RequestCredentials = 'include';

export interface SessionResponse {
  token: string;
  role: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details ?? [];
  }
}

export interface AuthApiOptions {
  fetcher?: Fetcher;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

export function resolveAuthApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    isString(value.error.code) &&
    isString(value.error.message) &&
    (
      value.error.details === undefined ||
      (
        Array.isArray(value.error.details) &&
        value.error.details.every(
          (detail) =>
            isRecord(detail) &&
            (detail.field === undefined || isString(detail.field)) &&
            isString(detail.message),
        )
      )
    )
  );
}

async function parseJsonBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

export async function createSession(
  payload: { username: string; password: string },
  options: AuthApiOptions = {},
): Promise<SessionResponse> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(resolveAuthApiUrl('/sessions'), {
    method: 'POST',
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonBody(response);

  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiRequestError(response.status, body);
    }

    throw new ApiRequestError(response.status, {
      error: {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
      },
    });
  }

  if (!isRecord(body) || !isString(body.token) || !isString(body.role)) {
    throw new ApiRequestError(response.status, {
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Login response is invalid.',
      },
    });
  }

  return { token: body.token, role: body.role };
}

export async function deleteSession(options: AuthApiOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(resolveAuthApiUrl('/sessions'), {
    method: 'DELETE',
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await parseJsonBody(response);
    if (isApiErrorBody(body)) {
      throw new ApiRequestError(response.status, body);
    }

    throw new ApiRequestError(response.status, {
      error: {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
      },
    });
  }
}
