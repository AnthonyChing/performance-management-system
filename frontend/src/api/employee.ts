import { getStoredAuthToken, toAuthorizationHeader } from '../features/auth';

export const API_BASE_PATH = '/api/v1';
const DEFAULT_REQUEST_CREDENTIALS: RequestCredentials = 'include';

export type EmploymentStatus = 'active' | 'on_leave' | 'terminated';
export type PerformanceCycleStatus =
  | 'not_started'
  | 'in_progress'
  | 'locked'
  | 'results_published'
  | 'completed'
  | 'closed';

export interface Department {
  department_id: string;
  name: string;
}

export interface ProfileManager {
  user_id: string;
  name: string;
  english_name: string | null;
  email: string;
}

export interface EmployeeProfile {
  user_id: string;
  employee_id: string;
  name: string;
  english_name: string | null;
  avatar_url: string | null;
  job_title: string;
  job_category: string;
  department: Department;
  location: string | null;
  email: string;
  employment_status: EmploymentStatus;
  terminated_at: string | null;
  manager: ProfileManager | null;
}

export interface ProfileResponse {
  profile: EmployeeProfile;
}

export interface PerformanceCycleSummary {
  cycle_id: string;
  name: string;
  cycle_type: string;
  period_label: string;
  start_date: string;
  end_date: string;
  timezone: string;
  status: PerformanceCycleStatus;
  is_locked: boolean;
  results_published_at: string | null;
  updated_at: string;
}

export interface CurrentPerformanceCycleResponse {
  cycle: PerformanceCycleSummary;
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

export class ApiResponseValidationError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`API response shape does not match employee_api.md: ${path}`);
    this.name = 'ApiResponseValidationError';
    this.path = path;
  }
}

export interface EmployeeApiOptions {
  fetcher?: Fetcher;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  authToken?: string | null;
}

const cycleStatuses = new Set<PerformanceCycleStatus>([
  'not_started',
  'in_progress',
  'locked',
  'results_published',
  'completed',
  'closed',
]);

const employmentStatuses = new Set<EmploymentStatus>([
  'active',
  'on_leave',
  'terminated',
]);

export function resolveEmployeeApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || isNullableString(value);
}

function isDepartment(value: unknown): value is Department {
  return (
    isRecord(value) &&
    isString(value.department_id) &&
    isString(value.name)
  );
}

function isProfileManager(value: unknown): value is ProfileManager {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.english_name) &&
    isString(value.email)
  );
}

function isEmployeeProfile(value: unknown): value is EmployeeProfile {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isString(value.employee_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.english_name) &&
    isOptionalNullableString(value.avatar_url) &&
    isString(value.job_title) &&
    isString(value.job_category) &&
    isDepartment(value.department) &&
    isOptionalNullableString(value.location) &&
    isString(value.email) &&
    isString(value.employment_status) &&
    employmentStatuses.has(value.employment_status as EmploymentStatus) &&
    isOptionalNullableString(value.terminated_at) &&
    (value.manager === undefined || value.manager === null || isProfileManager(value.manager))
  );
}

function isProfileResponse(value: unknown): value is ProfileResponse {
  return isRecord(value) && isEmployeeProfile(value.profile);
}

function isPerformanceCycleSummary(value: unknown): value is PerformanceCycleSummary {
  return (
    isRecord(value) &&
    isString(value.cycle_id) &&
    isString(value.name) &&
    isString(value.cycle_type) &&
    isString(value.period_label) &&
    isString(value.start_date) &&
    isString(value.end_date) &&
    isString(value.timezone) &&
    isString(value.status) &&
    cycleStatuses.has(value.status as PerformanceCycleStatus) &&
    typeof value.is_locked === 'boolean' &&
    isOptionalNullableString(value.results_published_at) &&
    isString(value.updated_at)
  );
}

function isCurrentPerformanceCycleResponse(
  value: unknown,
): value is CurrentPerformanceCycleResponse {
  return isRecord(value) && isPerformanceCycleSummary(value.cycle);
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

function resolveAuthToken(authToken: string | null | undefined) {
  if (authToken !== undefined) {
    return authToken?.trim() || null;
  }

  return getStoredAuthToken();
}

async function requestJson<T>(
  path: string,
  validate: (value: unknown) => value is T,
  options: EmployeeApiOptions = {},
): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const authToken = resolveAuthToken(options.authToken);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers.Authorization = toAuthorizationHeader(authToken);
  }

  const response = await fetcher(resolveEmployeeApiUrl(path), {
    method: 'GET',
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers,
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

  if (!validate(body)) {
    throw new ApiResponseValidationError(path);
  }

  return body as T;
}

export function getMyProfile(options?: EmployeeApiOptions): Promise<ProfileResponse> {
  return requestJson<ProfileResponse>('/me/profile', isProfileResponse, options);
}

export function getCurrentPerformanceCycle(
  options?: EmployeeApiOptions,
): Promise<CurrentPerformanceCycleResponse> {
  return requestJson<CurrentPerformanceCycleResponse>(
    '/me/performance-cycles/current',
    isCurrentPerformanceCycleResponse,
    options,
  );
}
