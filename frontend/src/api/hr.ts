import { getStoredAuthToken, toAuthorizationHeader } from '../features/auth/tokenStorage';

export const API_BASE_PATH = (import.meta.env.VITE_API_ORIGIN || '') + '/api/v1';
const DEFAULT_REQUEST_CREDENTIALS: RequestCredentials = 'include';

type TemplateStatus = 'draft' | 'published';
type QuestionType = 'rating' | 'text' | 'boolean';
type EvaluationTemplateStatus = 'published' | 'archived';
export type CycleStatus = 'draft' | 'not_started' | 'in_progress' | 'locked' | 'results_published' | 'completed' | 'closed';
export type CycleType = 'annual' | 'quarterly' | 'probation';

type EmployeeGroupType = 'all' | 'department' | 'job_category';

type EditBlockedReason = 'FORMAL_REVIEW_STARTED' | 'TEMPLATE_ARCHIVED' | null;

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string | null;
  job_category: string | null;
  is_active: boolean;
  status: TemplateStatus;
  usage_count: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  question_text: string;
  question_type: QuestionType;
  rating_scale_max: number | null;
  is_required: boolean;
  sort_order: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface AssessmentTemplateListItem {
  id: string;
  name: string;
  job_category: string | null;
  status: TemplateStatus;
  is_active: boolean;
}

export interface AssessmentTemplateListResponse {
  data: AssessmentTemplateListItem[];
  meta: PaginationMeta;
}

export interface AssessmentTemplateQuestionsResponse {
  data: Array<Pick<TemplateQuestion, 'id' | 'question_text' | 'question_type' | 'sort_order'>>;
}

export interface EmployeeGroup {
  group_id: string;
  group_type: EmployeeGroupType;
  name: string;
  description?: string | null;
}

export interface EmployeeGroupListResponse {
  data: EmployeeGroup[];
}

export interface CycleSummary {
  cycle_id: string;
  name: string;
  cycle_type?: string;
  status: CycleStatus;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  cycle_type?: CycleType | string;
  status: CycleStatus;
  timezone?: string;
  self_eval_start?: string;
  self_eval_end?: string;
  manager_eval_start?: string;
  manager_eval_end?: string;
  hr_review_end?: string;
  results_published_at?: string | null;
  appeal_deadline_days?: number;
  is_locked?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceCycleListResponse {
  data: PerformanceCycle[];
  meta: PaginationMeta;
}

export interface PerformanceCycleCreatePayload {
  name: string;
  cycle_type: CycleType | string;
  timezone?: string;
  manager_eval_start: string;
  manager_eval_end: string;
  hr_review_end: string;
  appeal_deadline_days?: number;
}

export interface PerformanceCycleUpdatePayload {
  name?: string;
  timezone?: string;
  manager_eval_start?: string;
  manager_eval_end?: string;
  hr_review_end?: string;
  appeal_deadline_days?: number;
}

export interface AssessmentTemplateComponent {
  assessment_template_id: string;
  assessment_template_version_id: string;
  name: string;
  question_count: number;
  weight_percent: number;
}

export interface AvailableActions {
  can_edit: boolean;
  can_archive: boolean;
  edit_blocked_reason?: EditBlockedReason;
}

export interface EvaluationTemplate {
  template_id: string;
  cycle: CycleSummary;
  name: string;
  description?: string | null;
  status: EvaluationTemplateStatus;
  employee_group: EmployeeGroup;
  assessment_templates: AssessmentTemplateComponent[];
  total_weight_percent: number;
  available_actions: AvailableActions;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationTemplateListItem {
  template_id: string;
  cycle: CycleSummary;
  name: string;
  description?: string | null;
  status: EvaluationTemplateStatus;
  employee_group: EmployeeGroup;
  assessment_template_count: number;
  total_weight_percent: number;
  available_actions: AvailableActions;
  updated_at: string;
}

export interface EvaluationTemplateListResponse {
  data: EvaluationTemplateListItem[];
  meta: PaginationMeta;
}

export interface AssessmentStatusListResponse {
  data: Record<string, unknown>[];
  meta?: PaginationMeta;
}

export interface AuditLogListResponse {
  data: Record<string, unknown>[];
  meta?: PaginationMeta;
}

export interface AuditLogExportResponse {
  file_url?: string;
  message?: string;
}

export interface NotificationResponse {
  message: string;
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
    super(`API response shape does not match hr_api.md: ${path}`);
    this.name = 'ApiResponseValidationError';
    this.path = path;
  }
}

export interface HrApiOptions {
  fetcher?: Fetcher;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  authToken?: string | null;
}

const templateStatuses = new Set<TemplateStatus>(['draft', 'published']);
const questionTypes = new Set<QuestionType>(['rating', 'text', 'boolean']);
const evaluationTemplateStatuses = new Set<EvaluationTemplateStatus>(['published', 'archived']);
const cycleStatuses = new Set<CycleStatus>([
  'draft',
  'not_started',
  'in_progress',
  'locked',
  'results_published',
  'completed',
  'closed',
]);
const employeeGroupTypes = new Set<EmployeeGroupType>(['all', 'department', 'job_category']);

export function resolveHrApiUrl(path: string) {
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

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isRecord(value) &&
    isNumber(value.current_page) &&
    isNumber(value.total_pages) &&
    isNumber(value.total_count)
  );
}

function isAssessmentTemplate(value: unknown): value is AssessmentTemplate {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isNullableString(value.description) &&
    (value.job_category === undefined || isNullableString(value.job_category)) &&
    isBoolean(value.is_active) &&
    isString(value.status) &&
    templateStatuses.has(value.status as TemplateStatus) &&
    isNumber(value.usage_count)
  );
}

function isAssessmentTemplateListItem(value: unknown): value is AssessmentTemplateListItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.job_category === undefined || isNullableString(value.job_category)) &&
    isString(value.status) &&
    templateStatuses.has(value.status as TemplateStatus) &&
    isBoolean(value.is_active)
  );
}

function isAssessmentTemplateListResponse(value: unknown): value is AssessmentTemplateListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isAssessmentTemplateListItem) &&
    isPaginationMeta(value.meta)
  );
}

function isTemplateQuestion(value: unknown): value is TemplateQuestion {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.template_id) &&
    isString(value.question_text) &&
    isString(value.question_type) &&
    questionTypes.has(value.question_type as QuestionType) &&
    (value.rating_scale_max === null || isNumber(value.rating_scale_max)) &&
    isBoolean(value.is_required) &&
    isNumber(value.sort_order)
  );
}

function isAssessmentTemplateQuestionsResponse(
  value: unknown,
): value is AssessmentTemplateQuestionsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every((item) =>
      isRecord(item) &&
      isString(item.id) &&
      isString(item.question_text) &&
      isString(item.question_type) &&
      questionTypes.has(item.question_type as QuestionType) &&
      isNumber(item.sort_order)
    )
  );
}

function isEmployeeGroup(value: unknown): value is EmployeeGroup {
  return (
    isRecord(value) &&
    isString(value.group_id) &&
    isString(value.group_type) &&
    employeeGroupTypes.has(value.group_type as EmployeeGroupType) &&
    isString(value.name) &&
    (value.description === undefined || isNullableString(value.description))
  );
}

function isEmployeeGroupListResponse(value: unknown): value is EmployeeGroupListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isEmployeeGroup);
}

function isCycleSummary(value: unknown): value is CycleSummary {
  return (
    isRecord(value) &&
    isString(value.cycle_id) &&
    isString(value.name) &&
    isString(value.status) &&
    cycleStatuses.has(value.status as CycleStatus)
  );
}

function isPerformanceCycle(value: unknown): value is PerformanceCycle {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.status) &&
    cycleStatuses.has(value.status as CycleStatus) &&
    (value.cycle_type === undefined || isString(value.cycle_type)) &&
    (value.timezone === undefined || isString(value.timezone)) &&
    (value.self_eval_start === undefined || isString(value.self_eval_start)) &&
    (value.self_eval_end === undefined || isString(value.self_eval_end)) &&
    (value.manager_eval_start === undefined || isString(value.manager_eval_start)) &&
    (value.manager_eval_end === undefined || isString(value.manager_eval_end)) &&
    (value.hr_review_end === undefined || isString(value.hr_review_end)) &&
    (value.results_published_at === undefined || value.results_published_at === null || isString(value.results_published_at)) &&
    (value.appeal_deadline_days === undefined || isNumber(value.appeal_deadline_days)) &&
    (value.is_locked === undefined || isBoolean(value.is_locked)) &&
    (value.created_by === undefined || isString(value.created_by)) &&
    (value.created_at === undefined || isString(value.created_at)) &&
    (value.updated_at === undefined || isString(value.updated_at))
  );
}

function isPerformanceCycleListResponse(value: unknown): value is PerformanceCycleListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPerformanceCycle) &&
    (value.meta === undefined || isPaginationMeta(value.meta))
  );
}

function isAssessmentTemplateComponent(value: unknown): value is AssessmentTemplateComponent {
  return (
    isRecord(value) &&
    isString(value.assessment_template_id) &&
    isString(value.assessment_template_version_id) &&
    isString(value.name) &&
    isNumber(value.question_count) &&
    isNumber(value.weight_percent)
  );
}

function isAvailableActions(value: unknown): value is AvailableActions {
  return (
    isRecord(value) &&
    isBoolean(value.can_edit) &&
    isBoolean(value.can_archive) &&
    (
      value.edit_blocked_reason === undefined ||
      value.edit_blocked_reason === null ||
      isString(value.edit_blocked_reason)
    )
  );
}

function isEvaluationTemplate(value: unknown): value is EvaluationTemplate {
  return (
    isRecord(value) &&
    isString(value.template_id) &&
    isCycleSummary(value.cycle) &&
    isString(value.name) &&
    (value.description === undefined || isNullableString(value.description)) &&
    isString(value.status) &&
    evaluationTemplateStatuses.has(value.status as EvaluationTemplateStatus) &&
    isEmployeeGroup(value.employee_group) &&
    Array.isArray(value.assessment_templates) &&
    value.assessment_templates.every(isAssessmentTemplateComponent) &&
    isNumber(value.total_weight_percent) &&
    isAvailableActions(value.available_actions)
  );
}

function isEvaluationTemplateListItem(value: unknown): value is EvaluationTemplateListItem {
  return (
    isRecord(value) &&
    isString(value.template_id) &&
    isCycleSummary(value.cycle) &&
    isString(value.name) &&
    (value.description === undefined || isNullableString(value.description)) &&
    isString(value.status) &&
    evaluationTemplateStatuses.has(value.status as EvaluationTemplateStatus) &&
    isEmployeeGroup(value.employee_group) &&
    isNumber(value.assessment_template_count) &&
    isNumber(value.total_weight_percent) &&
    isAvailableActions(value.available_actions) &&
    isString(value.updated_at)
  );
}

function isEvaluationTemplateListResponse(value: unknown): value is EvaluationTemplateListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isEvaluationTemplateListItem) &&
    isPaginationMeta(value.meta)
  );
}

function isAssessmentStatusListResponse(value: unknown): value is AssessmentStatusListResponse {
  return isRecord(value) && Array.isArray(value.data);
}

function isAuditLogListResponse(value: unknown): value is AuditLogListResponse {
  return isRecord(value) && Array.isArray(value.data);
}

function isAuditLogExportResponse(value: unknown): value is AuditLogExportResponse {
  return isRecord(value);
}

function isNotificationResponse(value: unknown): value is NotificationResponse {
  return isRecord(value) && isString(value.message);
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

function resolveAuthToken(authToken: string | null | undefined) {
  if (authToken !== undefined) {
    return authToken?.trim() || null;
  }

  return getStoredAuthToken();
}

async function parseJsonBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

async function requestJson<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  validate: (value: unknown) => value is T,
  body?: unknown,
  options: HrApiOptions = {},
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

  const response = await fetcher(resolveHrApiUrl(path), {
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

async function requestNoContent(
  path: string,
  method: 'DELETE',
  body?: unknown,
  options: HrApiOptions = {},
): Promise<void> {
  const fetcher = options.fetcher ?? fetch;
  const authToken = resolveAuthToken(options.authToken);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers.Authorization = toAuthorizationHeader(authToken);
  }

  const response = await fetcher(resolveHrApiUrl(path), {
    method,
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const parsedBody = await parseJsonBody(response);
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
}

export function createAssessmentTemplate(
  body: { name: string; description?: string; job_category?: string },
  options?: HrApiOptions,
): Promise<AssessmentTemplate> {
  return requestJson('/hr/assessment-templates', 'POST', isAssessmentTemplate, body, options);
}

export function updateAssessmentTemplate(
  templateId: string,
  body: { name?: string; description?: string; job_category?: string },
  options?: HrApiOptions,
): Promise<AssessmentTemplate> {
  return requestJson(`/hr/assessment-templates/${templateId}`, 'PATCH', isAssessmentTemplate, body, options);
}

export function deleteAssessmentTemplate(
  templateId: string,
  options?: HrApiOptions,
): Promise<void> {
  return requestNoContent(`/hr/assessment-templates/${templateId}`, 'DELETE', undefined, options);
}

export function getAssessmentTemplate(
  templateId: string,
  options?: HrApiOptions,
): Promise<AssessmentTemplate> {
  return requestJson(`/hr/assessment-templates/${templateId}`, 'GET', isAssessmentTemplate, undefined, options);
}

export function listAssessmentTemplates(
  query: { page?: number; status?: TemplateStatus; job_category?: string } = {},
  options?: HrApiOptions,
): Promise<AssessmentTemplateListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.status) params.set('status', query.status);
  if (query.job_category) params.set('job_category', query.job_category);
  const path = params.toString()
    ? `/hr/assessment-templates?${params.toString()}`
    : '/hr/assessment-templates';
  return requestJson(path, 'GET', isAssessmentTemplateListResponse, undefined, options);
}

export function duplicateAssessmentTemplate(
  templateId: string,
  options?: HrApiOptions,
): Promise<AssessmentTemplate> {
  return requestJson(
    `/hr/assessment-templates/${templateId}/duplicate`,
    'POST',
    isAssessmentTemplate,
    undefined,
    options,
  );
}

export function publishAssessmentTemplate(
  templateId: string,
  options?: HrApiOptions,
): Promise<{ id: string; status: TemplateStatus; updated_at: string }>{
  return requestJson(
    `/hr/assessment-templates/${templateId}/publish`,
    'POST',
    (value: unknown): value is { id: string; status: TemplateStatus; updated_at: string } =>
      isRecord(value) &&
      isString(value.id) &&
      isString(value.status) &&
      templateStatuses.has(value.status as TemplateStatus) &&
      isString(value.updated_at),
    undefined,
    options,
  );
}

export function createAssessmentTemplateQuestion(
  templateId: string,
  body: {
    question_text: string;
    question_type: QuestionType;
    rating_scale_max?: number;
    is_required?: boolean;
  },
  options?: HrApiOptions,
): Promise<TemplateQuestion> {
  return requestJson(
    `/hr/assessment-templates/${templateId}/questions`,
    'POST',
    isTemplateQuestion,
    body,
    options,
  );
}

export function updateAssessmentTemplateQuestion(
  templateId: string,
  questionId: string,
  body: {
    question_text?: string;
    question_type?: QuestionType;
    rating_scale_max?: number | null;
    is_required?: boolean;
  },
  options?: HrApiOptions,
): Promise<TemplateQuestion> {
  return requestJson(
    `/hr/assessment-templates/${templateId}/questions/${questionId}`,
    'PATCH',
    isTemplateQuestion,
    body,
    options,
  );
}

export function deleteAssessmentTemplateQuestion(
  templateId: string,
  questionId: string,
  options?: HrApiOptions,
): Promise<void> {
  return requestNoContent(
    `/hr/assessment-templates/${templateId}/questions/${questionId}`,
    'DELETE',
    undefined,
    options,
  );
}

export function getAssessmentTemplateQuestion(
  templateId: string,
  questionId: string,
  options?: HrApiOptions,
): Promise<TemplateQuestion> {
  return requestJson(
    `/hr/assessment-templates/${templateId}/questions/${questionId}`,
    'GET',
    isTemplateQuestion,
    undefined,
    options,
  );
}

export function listAssessmentTemplateQuestions(
  templateId: string,
  options?: HrApiOptions,
): Promise<AssessmentTemplateQuestionsResponse> {
  return requestJson(
    `/hr/assessment-templates/${templateId}/questions`,
    'GET',
    isAssessmentTemplateQuestionsResponse,
    undefined,
    options,
  );
}

export function reorderAssessmentTemplateQuestions(
  templateId: string,
  ordered_question_ids: string[],
  options?: HrApiOptions,
): Promise<{ message: string }>{
  return requestJson(
    `/hr/assessment-templates/${templateId}/questions/reorder`,
    'PATCH',
    (value: unknown): value is { message: string } => isRecord(value) && isString(value.message),
    { ordered_question_ids },
    options,
  );
}

export function applyAssessmentTemplateLegacy(
  templateId: string,
  body: { target_departments?: string[]; target_job_levels?: string[] },
  options?: HrApiOptions,
): Promise<{ message: string }>{
  return requestJson(
    `/hr/assessment-templates/${templateId}/applications`,
    'POST',
    (value: unknown): value is { message: string } => isRecord(value) && isString(value.message),
    body,
    options,
  );
}

export function listEmployeeGroups(options?: HrApiOptions): Promise<EmployeeGroupListResponse> {
  return requestJson('/hr/employee-groups', 'GET', isEmployeeGroupListResponse, undefined, options);
}

export function createEvaluationTemplate(
  body: {
    cycle_id: string;
    name: string;
    description?: string;
    employee_group_id: string;
    assessment_templates: Array<{ assessment_template_id: string; weight_percent: number }>;
  },
  options?: HrApiOptions,
): Promise<EvaluationTemplate> {
  return requestJson('/hr/evaluation-templates', 'POST', isEvaluationTemplate, body, options);
}

export function updateEvaluationTemplate(
  templateId: string,
  body: {
    cycle_id?: string;
    name?: string;
    description?: string;
    employee_group_id?: string;
    assessment_templates?: Array<{ assessment_template_id: string; weight_percent: number }>;
    status?: EvaluationTemplateStatus;
  },
  options?: HrApiOptions,
): Promise<EvaluationTemplate> {
  return requestJson(`/hr/evaluation-templates/${templateId}`, 'PATCH', isEvaluationTemplate, body, options);
}

export function getEvaluationTemplate(
  templateId: string,
  options?: HrApiOptions,
): Promise<EvaluationTemplate> {
  return requestJson(`/hr/evaluation-templates/${templateId}`, 'GET', isEvaluationTemplate, undefined, options);
}

export function listEvaluationTemplates(
  query: { page?: number; page_size?: number; status?: EvaluationTemplateStatus; cycle_id?: string; q?: string } = {},
  options?: HrApiOptions,
): Promise<EvaluationTemplateListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.page_size) params.set('page_size', String(query.page_size));
  if (query.status) params.set('status', query.status);
  if (query.cycle_id) params.set('cycle_id', query.cycle_id);
  if (query.q) params.set('q', query.q);
  const path = params.toString()
    ? `/hr/evaluation-templates?${params.toString()}`
    : '/hr/evaluation-templates';
  return requestJson(path, 'GET', isEvaluationTemplateListResponse, undefined, options);
}

export function createPerformanceCycle(
  body: PerformanceCycleCreatePayload,
  options?: HrApiOptions,
): Promise<PerformanceCycle> {
  return requestJson('/hr/performance-cycles', 'POST', isPerformanceCycle, body, options);
}

export function listPerformanceCycles(
  query: { page?: number; page_size?: number; status?: CycleStatus } = {},
  options?: HrApiOptions,
): Promise<PerformanceCycleListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.page_size) params.set('page_size', String(query.page_size));
  if (query.status) params.set('status', query.status);
  const path = params.toString()
    ? `/hr/performance-cycles?${params.toString()}`
    : '/hr/performance-cycles';
  return requestJson(path, 'GET', isPerformanceCycleListResponse, undefined, options);
}

export function getPerformanceCycle(
  cycleId: string,
  options?: HrApiOptions,
): Promise<PerformanceCycle> {
  return requestJson(`/hr/performance-cycles/${cycleId}`, 'GET', isPerformanceCycle, undefined, options);
}

export function updatePerformanceCycle(
  cycleId: string,
  body: PerformanceCycleUpdatePayload,
  options?: HrApiOptions,
): Promise<PerformanceCycle> {
  return requestJson(`/hr/performance-cycles/${cycleId}`, 'PATCH', isPerformanceCycle, body, options);
}

export function updatePerformanceCycleStatus(
  cycleId: string,
  status: CycleStatus,
  options?: HrApiOptions,
): Promise<PerformanceCycle> {
  return requestJson(
    `/hr/performance-cycles/${cycleId}/status`,
    'PATCH',
    isPerformanceCycle,
    { status },
    options,
  );
}

export function listAssessmentStatuses(
  query: { page?: number } = {},
  options?: HrApiOptions,
): Promise<AssessmentStatusListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  const path = params.toString()
    ? `/hr/assessment-statuses?${params.toString()}`
    : '/hr/assessment-statuses';
  return requestJson(path, 'GET', isAssessmentStatusListResponse, undefined, options);
}

export function listAuditLogs(
  query: { page?: number } = {},
  options?: HrApiOptions,
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  const path = params.toString()
    ? `/hr/audit-logs?${params.toString()}`
    : '/hr/audit-logs';
  return requestJson(path, 'GET', isAuditLogListResponse, undefined, options);
}

export function exportAuditLogs(
  body: Record<string, unknown> = {},
  options?: HrApiOptions,
): Promise<AuditLogExportResponse> {
  return requestJson('/hr/audit-log-exports', 'POST', isAuditLogExportResponse, body, options);
}

export function createNotification(
  body: Record<string, unknown>,
  options?: HrApiOptions,
): Promise<NotificationResponse> {
  return requestJson('/hr/notifications', 'POST', isNotificationResponse, body, options);
}
