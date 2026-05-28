import { getStoredAuthToken, toAuthorizationHeader } from '../features/auth/tokenStorage';

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

export interface KpiCycleSummary {
  cycle_id: string;
  name: string;
  cycle_type?: string | null;
  period_label?: string | null;
  review_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  status?: string | null;
  is_locked?: boolean | null;
  results_published_at?: string | null;
  updated_at?: string | null;
}

export interface KpiEmployeeSummary {
  user_id: string;
  name: string;
  department?: string | null;
}

export interface KpiTarget {
  operator?: string | null;
  value?: number | null;
  unit?: string | null;
  display_text?: string | null;
}

export interface KpiStandard {
  kpi_id: string;
  name: string;
  description?: string | null;
  weight_percent: number;
  target: KpiTarget;
}

export interface KpiStandardsResponse {
  cycle: KpiCycleSummary;
  employee?: KpiEmployeeSummary | null;
  standards: KpiStandard[];
}

export interface KpiScoreSummary {
  performance_score?: number | null;
  kpi_achievement_percent?: number | null;
  manager_review_score?: number | null;
}

export interface KpiActual {
  value?: number | null;
  unit?: string | null;
  display_text?: string | null;
}

export interface KpiSnapshot {
  snapshot_id: string;
  value?: number | null;
  note?: string | null;
  recorded_at?: string | null;
}

export interface KpiResultItem {
  kpi_id: string;
  name: string;
  weight_percent: number;
  actual?: KpiActual | null;
  target?: KpiTarget | null;
  achievement_percent?: number | null;
  score?: number | null;
  latest_snapshot?: KpiSnapshot | null;
}

export interface KpiManagerEvaluation {
  score?: number | null;
  comment?: string | null;
}

export interface KpiAvailableActions {
  can_confirm?: boolean | null;
  confirm_unavailable_reason?: string | null;
  can_dispute?: boolean | null;
  dispute_unavailable_reason?: string | null;
}

export interface KpiConfirmation {
  confirmation_id: string;
  result_id?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: KpiEmployeeSummary | null;
}

export interface KpiDisputePeriod {
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
}

export interface KpiResultSummary {
  result_id?: string | null;
  cycle?: KpiCycleSummary | null;
  employee?: KpiEmployeeSummary | null;
  status: string;
  published_at?: string | null;
  score_summary?: KpiScoreSummary | null;
  weighted_score?: number | null;
  review_score?: number | null;
  final_grade?: string | null;
  manager_evaluation?: KpiManagerEvaluation | null;
  kpi_results?: KpiResultItem[];
  available_actions?: KpiAvailableActions | null;
  confirmation?: KpiConfirmation | null;
  dispute_period?: KpiDisputePeriod | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
  performance_score?: number | null;
}

export interface KpiResultResponse {
  result: KpiResultSummary;
}

export interface KpiConfirmationResponse {
  confirmation: KpiConfirmation;
  result: KpiResultSummary;
}

export interface EmployeeAvailableActions {
  can_edit?: boolean | null;
  edit_unavailable_reason?: string | null;
  can_update_progress?: boolean | null;
  update_progress_unavailable_reason?: string | null;
  can_create_goal?: boolean | null;
  create_goal_unavailable_reason?: string | null;
  can_confirm?: boolean | null;
  confirm_unavailable_reason?: string | null;
  can_dispute?: boolean | null;
  dispute_unavailable_reason?: string | null;
  can_start_appeal?: boolean | null;
  start_appeal_unavailable_reason?: string | null;
  can_submit?: boolean | null;
  submit_unavailable_reason?: string | null;
}

export interface GoalCycleSummary {
  cycle_id: string;
  name: string;
  cycle_type?: string | null;
  period_label?: string | null;
  review_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  status?: string | null;
  is_locked?: boolean | null;
  is_review_locked?: boolean | null;
  review_locked_at?: string | null;
  results_published_at?: string | null;
  updated_at?: string | null;
  average_completion_percent?: number | null;
  goal_count?: number | null;
}

export interface GoalSummary {
  total_count?: number | null;
  pending_review_count?: number | null;
  in_progress_count?: number | null;
  revision_requested_count?: number | null;
  completed_count?: number | null;
  cancelled_count?: number | null;
  average_completion_percent?: number | null;
  goal_count?: number | null;
}

export interface GoalOwner {
  user_id: string;
  name?: string | null;
  department?: string | null;
}

export interface GoalReviewer {
  user_id: string;
  name?: string | null;
  english_name?: string | null;
  email?: string | null;
  title?: string | null;
}

export interface GoalProgressUpdateCreator {
  user_id: string;
  name?: string | null;
}

export interface GoalProgressUpdate {
  progress_update_id: string;
  goal_id?: string | null;
  progress_percent?: number | null;
  note?: string | null;
  created_at?: string | null;
  created_by?: GoalProgressUpdateCreator | null;
}

export interface GoalReview {
  review_id: string;
  decision?: string | null;
  comment?: string | null;
  reviewed_at?: string | null;
  reviewer?: GoalReviewer | null;
}

export interface EmployeeGoal {
  goal_id: string;
  cycle_id?: string | null;
  goal_type?: string | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: string | null;
  progress_percent?: number | null;
  owner?: GoalOwner | null;
  reviewer?: GoalReviewer | null;
  latest_progress_update?: GoalProgressUpdate | null;
  latest_review?: GoalReview | null;
  available_actions?: EmployeeAvailableActions | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CurrentGoalsResponse {
  cycle: GoalCycleSummary;
  available_actions?: EmployeeAvailableActions | null;
  summary?: GoalSummary | null;
  goals: EmployeeGoal[];
}

export interface GoalProgressUpdateRequest {
  progress_percent: number;
  note: string;
}

export interface GoalCreationRequest {
  title: string;
  due_date: string;
  description: string;
}

export interface GoalCreationResponse {
  goal: EmployeeGoal;
}

export interface EmployeeGoalUpdateResult {
  goal_id: string;
  cycle_id?: string | null;
  goal_type?: string | null;
  title?: string | null;
  description?: string | null;
  due_date?: string | null;
  status?: string | null;
  progress_percent?: number | null;
  owner?: GoalOwner | null;
  reviewer?: GoalReviewer | null;
  latest_progress_update?: GoalProgressUpdate | null;
  latest_review?: GoalReview | null;
  available_actions?: EmployeeAvailableActions | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GoalProgressUpdateResponse {
  progress_update: GoalProgressUpdate;
  goal: EmployeeGoalUpdateResult;
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

function isOptionalNullableNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || typeof value === 'number';
}

function isOptionalNullableBoolean(value: unknown): value is boolean | null | undefined {
  return value === undefined || value === null || typeof value === 'boolean';
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

function isKpiCycleSummary(value: unknown): value is KpiCycleSummary {
  return (
    isRecord(value) &&
    isString(value.cycle_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.cycle_type) &&
    isOptionalNullableString(value.period_label) &&
    isOptionalNullableString(value.review_type) &&
    isOptionalNullableString(value.start_date) &&
    isOptionalNullableString(value.end_date) &&
    isOptionalNullableString(value.timezone) &&
    isOptionalNullableString(value.status) &&
    isOptionalNullableBoolean(value.is_locked) &&
    isOptionalNullableString(value.results_published_at) &&
    isOptionalNullableString(value.updated_at)
  );
}

function isKpiEmployeeSummary(value: unknown): value is KpiEmployeeSummary {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.department)
  );
}

function isKpiTarget(value: unknown): value is KpiTarget {
  return (
    isRecord(value) &&
    isOptionalNullableString(value.operator) &&
    isOptionalNullableNumber(value.value) &&
    isOptionalNullableString(value.unit) &&
    isOptionalNullableString(value.display_text)
  );
}

function isKpiStandard(value: unknown): value is KpiStandard {
  return (
    isRecord(value) &&
    isString(value.kpi_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.description) &&
    typeof value.weight_percent === 'number' &&
    isKpiTarget(value.target)
  );
}

function isKpiStandardsResponse(value: unknown): value is KpiStandardsResponse {
  return (
    isRecord(value) &&
    isKpiCycleSummary(value.cycle) &&
    (value.employee === undefined ||
      value.employee === null ||
      isKpiEmployeeSummary(value.employee)) &&
    Array.isArray(value.standards) &&
    value.standards.every(isKpiStandard)
  );
}

function isKpiScoreSummary(value: unknown): value is KpiScoreSummary {
  return (
    isRecord(value) &&
    isOptionalNullableNumber(value.performance_score) &&
    isOptionalNullableNumber(value.kpi_achievement_percent) &&
    isOptionalNullableNumber(value.manager_review_score)
  );
}

function isKpiActual(value: unknown): value is KpiActual {
  return (
    isRecord(value) &&
    isOptionalNullableNumber(value.value) &&
    isOptionalNullableString(value.unit) &&
    isOptionalNullableString(value.display_text)
  );
}

function isKpiSnapshot(value: unknown): value is KpiSnapshot {
  return (
    isRecord(value) &&
    isString(value.snapshot_id) &&
    isOptionalNullableNumber(value.value) &&
    isOptionalNullableString(value.note) &&
    isOptionalNullableString(value.recorded_at)
  );
}

function isKpiResultItem(value: unknown): value is KpiResultItem {
  return (
    isRecord(value) &&
    isString(value.kpi_id) &&
    isString(value.name) &&
    typeof value.weight_percent === 'number' &&
    (value.actual === undefined || value.actual === null || isKpiActual(value.actual)) &&
    (value.target === undefined || value.target === null || isKpiTarget(value.target)) &&
    isOptionalNullableNumber(value.achievement_percent) &&
    isOptionalNullableNumber(value.score) &&
    (value.latest_snapshot === undefined ||
      value.latest_snapshot === null ||
      isKpiSnapshot(value.latest_snapshot))
  );
}

function isKpiManagerEvaluation(value: unknown): value is KpiManagerEvaluation {
  return (
    isRecord(value) &&
    isOptionalNullableNumber(value.score) &&
    isOptionalNullableString(value.comment)
  );
}

function isKpiAvailableActions(value: unknown): value is KpiAvailableActions {
  return (
    isRecord(value) &&
    isOptionalNullableBoolean(value.can_confirm) &&
    isOptionalNullableString(value.confirm_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_dispute) &&
    isOptionalNullableString(value.dispute_unavailable_reason)
  );
}

function isKpiConfirmation(value: unknown): value is KpiConfirmation {
  return (
    isRecord(value) &&
    isString(value.confirmation_id) &&
    isOptionalNullableString(value.result_id) &&
    isOptionalNullableString(value.confirmed_at) &&
    (value.confirmed_by === undefined ||
      value.confirmed_by === null ||
      isKpiEmployeeSummary(value.confirmed_by))
  );
}

function isKpiDisputePeriod(value: unknown): value is KpiDisputePeriod {
  return (
    isRecord(value) &&
    isString(value.status) &&
    isOptionalNullableString(value.start_date) &&
    isOptionalNullableString(value.end_date) &&
    isOptionalNullableString(value.timezone)
  );
}

function isKpiResultSummary(value: unknown): value is KpiResultSummary {
  return (
    isRecord(value) &&
    isOptionalNullableString(value.result_id) &&
    (value.cycle === undefined || value.cycle === null || isKpiCycleSummary(value.cycle)) &&
    (value.employee === undefined ||
      value.employee === null ||
      isKpiEmployeeSummary(value.employee)) &&
    isString(value.status) &&
    isOptionalNullableString(value.published_at) &&
    (value.score_summary === undefined ||
      value.score_summary === null ||
      isKpiScoreSummary(value.score_summary)) &&
    isOptionalNullableNumber(value.weighted_score) &&
    isOptionalNullableNumber(value.review_score) &&
    isOptionalNullableString(value.final_grade) &&
    (value.manager_evaluation === undefined ||
      value.manager_evaluation === null ||
      isKpiManagerEvaluation(value.manager_evaluation)) &&
    (value.kpi_results === undefined ||
      (Array.isArray(value.kpi_results) && value.kpi_results.every(isKpiResultItem))) &&
    (value.available_actions === undefined ||
      value.available_actions === null ||
      isKpiAvailableActions(value.available_actions)) &&
    (value.confirmation === undefined ||
      value.confirmation === null ||
      isKpiConfirmation(value.confirmation)) &&
    (value.dispute_period === undefined ||
      value.dispute_period === null ||
      isKpiDisputePeriod(value.dispute_period)) &&
    isOptionalNullableString(value.reviewed_at) &&
    isOptionalNullableString(value.updated_at) &&
    isOptionalNullableNumber(value.performance_score)
  );
}

function isKpiResultResponse(value: unknown): value is KpiResultResponse {
  return isRecord(value) && isKpiResultSummary(value.result);
}

function isKpiConfirmationResponse(value: unknown): value is KpiConfirmationResponse {
  return (
    isRecord(value) &&
    isKpiConfirmation(value.confirmation) &&
    isKpiResultSummary(value.result)
  );
}

function isEmployeeAvailableActions(value: unknown): value is EmployeeAvailableActions {
  return (
    isRecord(value) &&
    isOptionalNullableBoolean(value.can_edit) &&
    isOptionalNullableString(value.edit_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_update_progress) &&
    isOptionalNullableString(value.update_progress_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_create_goal) &&
    isOptionalNullableString(value.create_goal_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_confirm) &&
    isOptionalNullableString(value.confirm_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_dispute) &&
    isOptionalNullableString(value.dispute_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_start_appeal) &&
    isOptionalNullableString(value.start_appeal_unavailable_reason) &&
    isOptionalNullableBoolean(value.can_submit) &&
    isOptionalNullableString(value.submit_unavailable_reason)
  );
}

function isGoalCycleSummary(value: unknown): value is GoalCycleSummary {
  return (
    isRecord(value) &&
    isString(value.cycle_id) &&
    isString(value.name) &&
    isOptionalNullableString(value.cycle_type) &&
    isOptionalNullableString(value.period_label) &&
    isOptionalNullableString(value.review_type) &&
    isOptionalNullableString(value.start_date) &&
    isOptionalNullableString(value.end_date) &&
    isOptionalNullableString(value.timezone) &&
    isOptionalNullableString(value.status) &&
    isOptionalNullableBoolean(value.is_locked) &&
    isOptionalNullableBoolean(value.is_review_locked) &&
    isOptionalNullableString(value.review_locked_at) &&
    isOptionalNullableString(value.results_published_at) &&
    isOptionalNullableString(value.updated_at) &&
    isOptionalNullableNumber(value.average_completion_percent) &&
    isOptionalNullableNumber(value.goal_count)
  );
}

function isGoalSummary(value: unknown): value is GoalSummary {
  return (
    isRecord(value) &&
    isOptionalNullableNumber(value.total_count) &&
    isOptionalNullableNumber(value.pending_review_count) &&
    isOptionalNullableNumber(value.in_progress_count) &&
    isOptionalNullableNumber(value.revision_requested_count) &&
    isOptionalNullableNumber(value.completed_count) &&
    isOptionalNullableNumber(value.cancelled_count) &&
    isOptionalNullableNumber(value.average_completion_percent) &&
    isOptionalNullableNumber(value.goal_count)
  );
}

function isGoalOwner(value: unknown): value is GoalOwner {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isOptionalNullableString(value.name) &&
    isOptionalNullableString(value.department)
  );
}

function isGoalReviewer(value: unknown): value is GoalReviewer {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isOptionalNullableString(value.name) &&
    isOptionalNullableString(value.english_name) &&
    isOptionalNullableString(value.email) &&
    isOptionalNullableString(value.title)
  );
}

function isGoalProgressUpdateCreator(
  value: unknown,
): value is GoalProgressUpdateCreator {
  return (
    isRecord(value) &&
    isString(value.user_id) &&
    isOptionalNullableString(value.name)
  );
}

function isGoalProgressUpdate(value: unknown): value is GoalProgressUpdate {
  return (
    isRecord(value) &&
    isString(value.progress_update_id) &&
    isOptionalNullableString(value.goal_id) &&
    isOptionalNullableNumber(value.progress_percent) &&
    isOptionalNullableString(value.note) &&
    isOptionalNullableString(value.created_at) &&
    (
      value.created_by === undefined ||
      value.created_by === null ||
      isGoalProgressUpdateCreator(value.created_by)
    )
  );
}

function isGoalReview(value: unknown): value is GoalReview {
  return (
    isRecord(value) &&
    isString(value.review_id) &&
    isOptionalNullableString(value.decision) &&
    isOptionalNullableString(value.comment) &&
    isOptionalNullableString(value.reviewed_at) &&
    (
      value.reviewer === undefined ||
      value.reviewer === null ||
      isGoalReviewer(value.reviewer)
    )
  );
}

function isEmployeeGoal(value: unknown): value is EmployeeGoal {
  return (
    isRecord(value) &&
    isString(value.goal_id) &&
    isOptionalNullableString(value.cycle_id) &&
    isOptionalNullableString(value.goal_type) &&
    isString(value.title) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableString(value.due_date) &&
    isOptionalNullableString(value.status) &&
    isOptionalNullableNumber(value.progress_percent) &&
    (value.owner === undefined || value.owner === null || isGoalOwner(value.owner)) &&
    (
      value.reviewer === undefined ||
      value.reviewer === null ||
      isGoalReviewer(value.reviewer)
    ) &&
    (
      value.latest_progress_update === undefined ||
      value.latest_progress_update === null ||
      isGoalProgressUpdate(value.latest_progress_update)
    ) &&
    (
      value.latest_review === undefined ||
      value.latest_review === null ||
      isGoalReview(value.latest_review)
    ) &&
    (
      value.available_actions === undefined ||
      value.available_actions === null ||
      isEmployeeAvailableActions(value.available_actions)
    ) &&
    isOptionalNullableString(value.published_at) &&
    isOptionalNullableString(value.created_at) &&
    isOptionalNullableString(value.updated_at)
  );
}

function isEmployeeGoalUpdateResult(value: unknown): value is EmployeeGoalUpdateResult {
  return (
    isRecord(value) &&
    isString(value.goal_id) &&
    isOptionalNullableString(value.cycle_id) &&
    isOptionalNullableString(value.goal_type) &&
    isOptionalNullableString(value.title) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableString(value.due_date) &&
    isOptionalNullableString(value.status) &&
    isOptionalNullableNumber(value.progress_percent) &&
    (value.owner === undefined || value.owner === null || isGoalOwner(value.owner)) &&
    (
      value.reviewer === undefined ||
      value.reviewer === null ||
      isGoalReviewer(value.reviewer)
    ) &&
    (
      value.latest_progress_update === undefined ||
      value.latest_progress_update === null ||
      isGoalProgressUpdate(value.latest_progress_update)
    ) &&
    (
      value.latest_review === undefined ||
      value.latest_review === null ||
      isGoalReview(value.latest_review)
    ) &&
    (
      value.available_actions === undefined ||
      value.available_actions === null ||
      isEmployeeAvailableActions(value.available_actions)
    ) &&
    isOptionalNullableString(value.published_at) &&
    isOptionalNullableString(value.created_at) &&
    isOptionalNullableString(value.updated_at)
  );
}

function isCurrentGoalsResponse(value: unknown): value is CurrentGoalsResponse {
  return (
    isRecord(value) &&
    isGoalCycleSummary(value.cycle) &&
    (
      value.available_actions === undefined ||
      value.available_actions === null ||
      isEmployeeAvailableActions(value.available_actions)
    ) &&
    (
      value.summary === undefined ||
      value.summary === null ||
      isGoalSummary(value.summary)
    ) &&
    Array.isArray(value.goals) &&
    value.goals.every(isEmployeeGoal)
  );
}

function isGoalProgressUpdateResponse(
  value: unknown,
): value is GoalProgressUpdateResponse {
  return (
    isRecord(value) &&
    isGoalProgressUpdate(value.progress_update) &&
    isEmployeeGoalUpdateResult(value.goal)
  );
}

function isGoalCreationResponse(value: unknown): value is GoalCreationResponse {
  return isRecord(value) && isEmployeeGoal(value.goal);
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
  init: RequestInit = {},
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
    ...init,
    method: init.method ?? 'GET',
    credentials: options.credentials ?? DEFAULT_REQUEST_CREDENTIALS,
    signal: options.signal,
    headers: {
      ...headers,
      ...init.headers,
    },
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

export function getMyKpiStandards(
  options?: EmployeeApiOptions,
): Promise<KpiStandardsResponse> {
  return requestJson<KpiStandardsResponse>(
    '/me/kpis/standards',
    isKpiStandardsResponse,
    options,
  );
}

export function getMyKpiResult(options?: EmployeeApiOptions): Promise<KpiResultResponse> {
  return requestJson<KpiResultResponse>('/me/kpis/result', isKpiResultResponse, options);
}

export function confirmMyKpiResult(
  resultId: string,
  options?: EmployeeApiOptions,
): Promise<KpiConfirmationResponse> {
  return requestJson<KpiConfirmationResponse>(
    '/me/kpis/result-confirmations',
    isKpiConfirmationResponse,
    options,
    {
      method: 'POST',
      body: JSON.stringify({
        result_id: resultId,
        confirmed: true,
      }),
    },
  );
}

export function getMyCurrentGoals(
  options?: EmployeeApiOptions,
): Promise<CurrentGoalsResponse> {
  return requestJson<CurrentGoalsResponse>('/me/goals', isCurrentGoalsResponse, options);
}

export function createMyGoal(
  payload: GoalCreationRequest,
  options?: EmployeeApiOptions,
): Promise<GoalCreationResponse> {
  return requestJson<GoalCreationResponse>(
    '/me/goals',
    isGoalCreationResponse,
    options,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function updateMyGoalProgress(
  goalId: string,
  payload: GoalProgressUpdateRequest,
  options?: EmployeeApiOptions,
): Promise<GoalProgressUpdateResponse> {
  return requestJson<GoalProgressUpdateResponse>(
    `/me/goals/${encodeURIComponent(goalId)}/progress-updates`,
    isGoalProgressUpdateResponse,
    options,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
