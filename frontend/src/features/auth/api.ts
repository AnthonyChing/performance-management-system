import { API_BASE_PATH } from '../../api/config';
const DEFAULT_REQUEST_CREDENTIALS: RequestCredentials = 'include';

export interface GoogleAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  roles: string[];
}

export interface AuthApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface GoogleAuthOptions {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

function resolveAuthApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

async function parseJsonBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

function getErrorMessage(body: unknown, fallback: string) {
  if (isRecord(body) && isRecord(body.error) && isString(body.error.message)) {
    return {
      code: isString(body.error.code) ? body.error.code : 'AUTH_ERROR',
      message: body.error.message,
    };
  }

  return {
    code: 'HTTP_ERROR',
    message: fallback,
  };
}

function getStringField(body: Record<string, unknown>, camelCaseKey: string, snakeCaseKey: string) {
  const camelCaseValue = body[camelCaseKey];
  const snakeCaseValue = body[snakeCaseKey];

  if (isString(camelCaseValue)) {
    return camelCaseValue;
  }

  if (isString(snakeCaseValue)) {
    return snakeCaseValue;
  }

  return null;
}

function getNumberField(body: Record<string, unknown>, camelCaseKey: string, snakeCaseKey: string) {
  const camelCaseValue = body[camelCaseKey];
  const snakeCaseValue = body[snakeCaseKey];

  if (typeof camelCaseValue === 'number') {
    return camelCaseValue;
  }

  if (typeof snakeCaseValue === 'number') {
    return snakeCaseValue;
  }

  return null;
}

export async function authenticateWithGoogle(
  idToken: string,
  options: GoogleAuthOptions = {},
): Promise<GoogleAuthResponse> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(resolveAuthApiUrl('/auth/google'), {
    method: 'POST',
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token: idToken }),
  });

  const body = await parseJsonBody(response);

  if (!response.ok) {
    const error = getErrorMessage(body, `Google 登入失敗：HTTP ${response.status}`);
    throw new AuthApiError(response.status, error.message, error.code);
  }

  if (!isRecord(body)) {
    throw new AuthApiError(response.status, 'Google 登入回應格式不正確。', 'INVALID_RESPONSE');
  }

  const accessToken = getStringField(body, 'accessToken', 'access_token');
  const tokenType = getStringField(body, 'tokenType', 'token_type');
  const expiresIn = getNumberField(body, 'expiresIn', 'expires_in');
  const userId = getStringField(body, 'userId', 'user_id');
  const roles = body.roles;

  if (
    !accessToken ||
    !tokenType ||
    expiresIn === null ||
    !userId ||
    !Array.isArray(roles) ||
    !roles.every(isString)
  ) {
    throw new AuthApiError(response.status, 'Google 登入回應格式不正確。', 'INVALID_RESPONSE');
  }

  return {
    accessToken,
    tokenType,
    expiresIn,
    userId,
    roles,
  };
}
