import { getStoredAuthToken, toAuthorizationHeader } from '../features/auth/tokenStorage';

import { API_BASE_PATH } from './config';
const DEFAULT_REQUEST_CREDENTIALS: RequestCredentials = 'include';

export type GoalStatus = 'pending_review' | 'in_progress' | 'revision_requested' | 'completed' | 'cancelled';
type KpiType = 'individual' | 'team';
type AppealStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type RatingScale =
  | 'outstanding'
  | 'exceeds_expectations'
  | 'meets_expectations'
  | 'needs_improvement'
  | 'unacceptable';

export type ReviewStatus =
  | 'pending_self_eval'
  | 'self_eval_in_progress'
  | 'pending_manager_eval'
  | 'manager_eval_in_progress'
  | 'pending_hr_review'
  | 'completed'
  | 'terminated';

export type QuestionType = 'rating' | 'text' | 'boolean';

export interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  rating_scale_max: number | null;
  is_required: boolean;
  sort_order: number;
}

export interface KpiEvaluationItem {
  kpi_id: string;
  manager_score: number | null;
  manager_feedback: string | null;
}

export interface SubordinateGoal {
  id: string;
  cycle_id: string;
  owner_id: string;
  set_by: string;
  goal_type: string;
  title: string;
  description: string | null;
  progress_percent: number;
  due_date: string | null;
  status: GoalStatus;
  published_at: string | null;
}

export interface KpiAssignment {
  weight: number;
  target_value: number;
  current_value: number | null;
  last_updated_at: string | null;
}

export interface SubordinateKpi {
  id: string;
  cycle_id: string;
  created_by: string;
  kpi_type: KpiType;
  title: string;
  description: string | null;
  unit: string | null;
  target_operator: string | null;
  target_value: number | null;
  target_unit: string | null;
  target_display_text: string | null;
  assignment: KpiAssignment;
  published_at: string | null;
}

export interface ReviewResponse {
  id: string;
  question_id: string;
  respondent_type: string;
  rating_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  responded_at: string;
}

export interface AppealResponse {
  id: string;
  responded_by: string;
  visibility: string;
  response_text: string;
  is_final: boolean;
  responded_at: string;
}

export interface Appeal {
  id: string;
  review_id: string;
  case_no: string;
  filed_by: string;
  assigned_to_type: string;
  assigned_to: string;
  reason: string;
  status: AppealStatus;
  filed_at: string;
  resolved_at: string | null;
  responses?: AppealResponse[];
}

export interface EvaluationHistoryItem {
  id: string;
  cycle_id: string;
  employee_id: string;
  manager_id: string;
  status: ReviewStatus;
  final_rating: RatingScale | null;
  cycle_name?: string | null;
  manager_comment: string | null;
  kpi_score?: number | null;
  review_score?: number | null;
  score_computed_at?: string | null;
  self_submitted_at?: string | null;
  responses?: ReviewResponse[];
  kpi_evaluations?: KpiEvaluationItem[];
  questions?: EvaluationQuestion[];
  manager_submitted_at?: string | null;
  hr_approved_at?: string | null;
  is_terminated_employee?: boolean;
  updated_at?: string;
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
    super(`API response shape does not match manager_api.md: ${path}`);
    this.name = 'ApiResponseValidationError';
    this.path = path;
  }
}

export interface ManagerApiOptions {
  fetcher?: Fetcher;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  authToken?: string | null;
}

const goalStatuses = new Set<GoalStatus>([
  'pending_review',
  'in_progress',
  'revision_requested',
  'completed',
  'cancelled',
]);

const reviewStatuses = new Set<ReviewStatus>([
  'pending_self_eval',
  'self_eval_in_progress',
  'pending_manager_eval',
  'manager_eval_in_progress',
  'pending_hr_review',
  'completed',
  'terminated',
]);

export function resolveManagerApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isKpiAssignment(value: unknown): value is KpiAssignment {
  return (
    isRecord(value) &&
    isNumber(value.weight) &&
    isNumber(value.target_value) &&
    (value.current_value === undefined || value.current_value === null || isNumber(value.current_value)) &&
    (value.last_updated_at === undefined || isNullableString(value.last_updated_at))
  );
}

function isSubordinateGoal(value: unknown): value is SubordinateGoal {
  return (
    isRecord(value) &&
    (isString(value.id) || isString(value.goal_id) || isString(value.goalId)) &&
    isString(value.cycle_id) &&
    isString(value.owner_id) &&
    isString(value.set_by) &&
    isString(value.goal_type) &&
    isString(value.title) &&
    (value.description === undefined || isNullableString(value.description)) &&
    typeof value.progress_percent === 'number' &&
    (value.due_date === undefined || isNullableString(value.due_date)) &&
    isString(value.status) &&
    goalStatuses.has(value.status as GoalStatus) &&
    (value.published_at === undefined || isNullableString(value.published_at))
  );
}

function isSubordinateKpi(value: unknown): value is SubordinateKpi {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.cycle_id) &&
    isString(value.created_by) &&
    isString(value.kpi_type) &&
    isString(value.title) &&
    (value.description === undefined || isNullableString(value.description)) &&
    (value.unit === undefined || isNullableString(value.unit)) &&
    (value.target_operator === undefined || isNullableString(value.target_operator)) &&
    (value.target_value === undefined || value.target_value === null || isNumber(value.target_value)) &&
    (value.target_unit === undefined || isNullableString(value.target_unit)) &&
    (value.target_display_text === undefined || isNullableString(value.target_display_text)) &&
    isKpiAssignment(value.assignment) &&
    (value.published_at === undefined || isNullableString(value.published_at))
  );
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.question_id) &&
    isString(value.respondent_type) &&
    (value.rating_value === null || isNumber(value.rating_value)) &&
    (value.text_value === undefined || isNullableString(value.text_value)) &&
    (value.boolean_value === null || typeof value.boolean_value === 'boolean') &&
    isString(value.responded_at)
  );
}

function isAppealResponse(value: unknown): value is AppealResponse {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.responded_by) &&
    isString(value.visibility) &&
    isString(value.response_text) &&
    typeof value.is_final === 'boolean' &&
    isString(value.responded_at)
  );
}

function isAppeal(value: unknown): value is Appeal {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.review_id) &&
    isString(value.case_no) &&
    isString(value.filed_by) &&
    isString(value.assigned_to_type) &&
    isString(value.assigned_to) &&
    isString(value.reason) &&
    isString(value.status) &&
    isString(value.filed_at) &&
    (value.resolved_at === undefined || isNullableString(value.resolved_at)) &&
    (value.responses === undefined ||
      (Array.isArray(value.responses) && value.responses.every(isAppealResponse)))
  );
}

function isKpiEvaluationItem(value: unknown): value is KpiEvaluationItem {
  return (
    isRecord(value) &&
    isString(value.kpi_id) &&
    (value.manager_score === null || isNumber(value.manager_score)) &&
    (value.manager_feedback === undefined || isNullableString(value.manager_feedback))
  );
}

function isEvaluationQuestion(value: unknown): value is EvaluationQuestion {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.question_text) &&
    isString(value.question_type) &&
    (value.rating_scale_max === null || isNumber(value.rating_scale_max)) &&
    typeof value.is_required === 'boolean' &&
    isNumber(value.sort_order)
  );
}

function isEvaluationHistoryItem(value: unknown): value is EvaluationHistoryItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.cycle_id) &&
    isString(value.employee_id) &&
    isString(value.manager_id) &&
    isString(value.status) &&
    reviewStatuses.has(value.status as ReviewStatus) &&
    (value.final_rating === null || isString(value.final_rating)) &&
    (value.cycle_name === undefined || value.cycle_name === null || isString(value.cycle_name)) &&
    (value.manager_comment === undefined || isNullableString(value.manager_comment)) &&
    (value.kpi_score === undefined || value.kpi_score === null || isNumber(value.kpi_score)) &&
    (value.review_score === undefined || value.review_score === null || isNumber(value.review_score)) &&
    (value.score_computed_at === undefined || isNullableString(value.score_computed_at)) &&
    (value.self_submitted_at === undefined || isNullableString(value.self_submitted_at)) &&
    (value.responses === undefined ||
      (Array.isArray(value.responses) && value.responses.every(isReviewResponse))) &&
    (value.kpi_evaluations === undefined ||
      (Array.isArray(value.kpi_evaluations) && value.kpi_evaluations.every(isKpiEvaluationItem))) &&
    (value.questions === undefined ||
      (Array.isArray(value.questions) && value.questions.every(isEvaluationQuestion))) &&
    (value.manager_submitted_at === undefined || isNullableString(value.manager_submitted_at)) &&
    (value.hr_approved_at === undefined || isNullableString(value.hr_approved_at)) &&
    (value.is_terminated_employee === undefined || typeof value.is_terminated_employee === 'boolean') &&
    (value.updated_at === undefined || isString(value.updated_at))
  );
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

function handleUnauthorized(response: Response) {
  if (response.status !== 401) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const { pathname, search, hash } = window.location;
  if (pathname === '/login') {
    return;
  }

  const redirectTarget = `${pathname}${search}${hash}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTarget)}`;
  window.location.replace(loginUrl);
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
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  validate: (value: unknown) => value is T,
  body?: unknown,
  options: ManagerApiOptions = {},
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

  const response = await fetcher(resolveManagerApiUrl(path), {
    method,
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  handleUnauthorized(response);

  const parsedBody = await parseJsonBody(response);

  if (!response.ok) {
    if (isApiErrorBody(parsedBody)) {
      throw new ApiRequestError(response.status, parsedBody);
    }

    throw new ApiRequestError(response.status, {
      error: {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
      },
    });
  }

  if (!validate(parsedBody)) {
    throw new ApiResponseValidationError(path);
  }

  return parsedBody as T;
}

function isDataArray<T>(value: unknown, validator: (item: unknown) => item is T): value is { data: T[] } {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(validator);
}

export function createGoal(
  userId: string,
  payload: {
    title: string;
    description?: string;
    goal_type?: string;
    due_date?: string | null;
  },
  options?: ManagerApiOptions,
): Promise<SubordinateGoal> {
  return requestJson(
    `/users/${userId}/goals`,
    'POST',
    isSubordinateGoal,
    payload,
    options,
  ).then(res => ({
    ...res,
    id: res.id || (res as any).goal_id || (res as any).goalId
  }));
}

export function updateGoal(
  userId: string,
  goalId: string,
  payload: {
    status?: GoalStatus;
    title?: string;
    description?: string;
    due_date?: string | null;
  },
  options?: ManagerApiOptions,
): Promise<SubordinateGoal> {
  return requestJson(
    `/users/${userId}/goals/${goalId}`,
    'PATCH',
    isSubordinateGoal,
    payload,
    options,
  ).then(res => ({
    ...res,
    id: res.id || (res as any).goal_id || (res as any).goalId
  }));
}

export function listGoals(
  userId: string,
  params: { cycle_id?: string; status?: GoalStatus } = {},
  options?: ManagerApiOptions,
): Promise<{ data: SubordinateGoal[] }> {
  const search = new URLSearchParams();
  if (params.cycle_id) search.set('cycle_id', params.cycle_id);
  if (params.status) search.set('status', params.status);
  const query = search.toString();
  const path = query ? `/users/${userId}/goals?${query}` : `/users/${userId}/goals`;

  return requestJson(path, 'GET', (value): value is { data: SubordinateGoal[] } =>
    isDataArray(value, isSubordinateGoal),
    undefined,
    options,
  ).then(res => ({
    data: res.data.map(item => ({
      ...item,
      id: item.id || (item as any).goal_id || (item as any).goalId
    }))
  }));
}

export function createKpi(
  userId: string,
  payload: {
    title: string;
    description?: string;
    kpi_type: KpiType;
    unit?: string;
    weight: number;
    target_value: number;
    target_operator?: string;
    target_unit?: string;
    target_display_text?: string;
  },
  options?: ManagerApiOptions,
): Promise<{ data: SubordinateKpi[] }> {
  return requestJson(
    `/users/${userId}/kpis`,
    'POST',
    (value): value is { data: SubordinateKpi[] } => isDataArray(value, isSubordinateKpi),
    payload,
    options,
  );
}

export function updateKpi(
  userId: string,
  kpiId: string,
  payload: {
    target_value?: number;
    current_value?: number;
    weight?: number;
    title?: string;
    description?: string;
    unit?: string;
    kpi_type?: KpiType;
    target_operator?: string;
    target_unit?: string;
    target_display_text?: string;
  },
  options?: ManagerApiOptions,
): Promise<SubordinateKpi> {
  return requestJson(
    `/users/${userId}/kpis/${kpiId}`,
    'PATCH',
    isSubordinateKpi,
    payload,
    options,
  );
}

export function deleteKpi(
  userId: string,
  kpiId: string,
  options?: ManagerApiOptions,
): Promise<null> {
  const fetcher = options?.fetcher ?? fetch;
  const authToken = resolveAuthToken(options?.authToken);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (authToken) {
    headers.Authorization = toAuthorizationHeader(authToken);
  }

  return fetcher(resolveManagerApiUrl(`/users/${userId}/kpis/${kpiId}`), {
    method: 'DELETE',
    credentials: options?.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options?.signal,
    headers,
  }).then((response) => {
    handleUnauthorized(response);
    if (!response.ok) {
      return parseJsonBody(response).then((body) => {
        if (isApiErrorBody(body)) {
          throw new ApiRequestError(response.status, body);
        }
        throw new ApiRequestError(response.status, {
          error: { code: 'HTTP_ERROR', message: `HTTP ${response.status}` },
        });
      });
    }
    return null;
  });
}

export function listKpis(
  userId: string,
  params: { cycle_id?: string } = {},
  options?: ManagerApiOptions,
): Promise<{ data: SubordinateKpi[] }> {
  const search = new URLSearchParams();
  if (params.cycle_id) search.set('cycle_id', params.cycle_id);
  const query = search.toString();
  const path = query ? `/users/${userId}/kpis?${query}` : `/users/${userId}/kpis`;

  return requestJson(path, 'GET', (value): value is { data: SubordinateKpi[] } =>
    isDataArray(value, isSubordinateKpi),
    undefined,
    options,
  );
}

export function submitQuestionnaireEvaluation(
  userId: string,
  evaluationId: string,
  payload: {
    responses: Array<{
      question_id: string;
      rating_value?: number;
      text_value?: string;
      boolean_value?: boolean;
    }>;
  },
  options?: ManagerApiOptions,
): Promise<{
  review_id: string;
  responses: ReviewResponse[];
  updated_at: string;
}> {
  return requestJson(
    `/users/${userId}/evaluations/${evaluationId}/questionnaire`,
    'PATCH',
    (value): value is { review_id: string; responses: ReviewResponse[]; updated_at: string } =>
      isRecord(value) &&
      isString(value.review_id) &&
      Array.isArray(value.responses) &&
      value.responses.every(isReviewResponse) &&
      isString(value.updated_at),
    payload,
    options,
  );
}

export function submitKpiEvaluation(
  userId: string,
  evaluationId: string,
  payload: {
    status: ReviewStatus;
    final_rating?: RatingScale;
    manager_comment?: string;
    kpi_evaluations?: Array<{
      kpi_id: string;
      manager_score?: number;
      manager_feedback?: string;
    }>;
  },
  options?: ManagerApiOptions,
): Promise<EvaluationHistoryItem> {
  return requestJson(
    `/users/${userId}/evaluations/${evaluationId}/kpis`,
    'PATCH',
    isEvaluationHistoryItem,
    payload,
    options,
  );
}

export function listAllSubordinateGoals(
  params: { cycle_id?: string; status?: GoalStatus } = {},
  options?: ManagerApiOptions,
): Promise<{ data: SubordinateGoal[] }> {
  const query = new URLSearchParams();
  if (params.cycle_id) query.set('cycle_id', params.cycle_id);
  if (params.status) query.set('status', params.status);
  const path = query.toString() ? `/manager/subordinates-goals?${query.toString()}` : `/manager/subordinates-goals`;
  return requestJson(
    path,
    'GET',
    (value: unknown): value is { data: SubordinateGoal[] } =>
      isRecord(value) && Array.isArray(value.data) && value.data.every(isSubordinateGoal),
    undefined,
    options,
  ).then(res => ({
    data: res.data.map(item => ({
      ...item,
      id: item.id || (item as any).goal_id || (item as any).goalId
    }))
  }));
}

export function listMySubordinates(
  options?: ManagerApiOptions,
): Promise<{ data: Array<{ id: string; employee_id: string; name: string; email: string; department: string; job_title: string }> }> {
  return requestJson(
    '/manager/subordinates',
    'GET',
    (value: unknown): value is { data: Array<{ id: string; employee_id: string; name: string; email: string; department: string; job_title: string }> } =>
      isRecord(value) && Array.isArray(value.data) && value.data.every(item =>
        isRecord(item) && isString(item.id) && isString(item.name)
      ),
    undefined,
    options,
  );
}


export function listEvaluations(
  userId: string,
  params: { cycle_id?: string } = {},
  options?: ManagerApiOptions,
): Promise<{ data: EvaluationHistoryItem[] }> {
  const search = new URLSearchParams();
  if (params.cycle_id) search.set('cycle_id', params.cycle_id);
  const query = search.toString();
  const path = query
    ? `/users/${userId}/evaluations?${query}`
    : `/users/${userId}/evaluations`;

  return requestJson(path, 'GET', (value): value is { data: EvaluationHistoryItem[] } =>
    isDataArray(value, isEvaluationHistoryItem),
    undefined,
    options,
  );
}

export function listAppeals(
  teamId: string,
  params: { status?: AppealStatus } = {},
  options?: ManagerApiOptions,
): Promise<{ data: Appeal[] }> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  const query = search.toString();
  const path = query ? `/teams/${teamId}/appeals?${query}` : `/teams/${teamId}/appeals`;

  return requestJson(path, 'GET', (value): value is { data: Appeal[] } =>
    isDataArray(value, isAppeal),
    undefined,
    options,
  );
}

export function getAppeal(
  teamId: string,
  appealId: string,
  options?: ManagerApiOptions,
): Promise<Appeal> {
  return requestJson(
    `/teams/${teamId}/appeals/${appealId}`,
    'GET',
    isAppeal,
    undefined,
    options,
  );
}

export function updateAppeal(
  teamId: string,
  appealId: string,
  payload: {
    response_text: string;
    is_final: boolean;
  },
  options?: ManagerApiOptions,
): Promise<Appeal> {
  return requestJson(
    `/teams/${teamId}/appeals/${appealId}`,
    'PATCH',
    isAppeal,
    payload,
    options,
  );
}
