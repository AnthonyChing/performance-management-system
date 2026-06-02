import type {
  EvaluationHistoryItem,
  EvaluationQuestion,
  RatingScale,
  ReviewResponse,
  ReviewStatus,
} from '../../api/manager';

export type {
  EvaluationHistoryItem,
  EvaluationQuestion,
  KpiEvaluationItem,
  RatingScale,
  ReviewResponse,
  ReviewStatus,
  SubordinateKpi,
} from '../../api/manager';

export type TeamEvaluationSubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'locked';

export interface QuestionnaireDraftResponse {
  question_id: string;
  rating_value?: number;
  text_value?: string;
  boolean_value?: boolean;
}

export interface KpiEvaluationDraft {
  kpi_id: string;
  current_value: number | '';
  manager_feedback: string;
}

export interface QuestionnaireValidationIssue {
  question_id: string;
  message: string;
}

export interface MemberEvaluationContext {
  evaluation: EvaluationHistoryItem | null;
  questions: EvaluationQuestion[];
  editable: boolean;
  lockReason: string | null;
}
