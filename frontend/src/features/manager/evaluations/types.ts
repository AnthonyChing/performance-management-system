import type {
  EvaluationHistoryItem,
  EvaluationQuestion,
  SubordinateKpi,
} from '../../../api/manager';
import type {
  KpiEvaluationDraft,
  TeamEvaluationSubmissionStatus,
} from '../../../shared/evaluation';
import type { TeamMember } from '../../../shared/api/mockData';

export type {
  EvaluationHistoryItem,
  EvaluationQuestion,
  KpiEvaluationItem,
  RatingScale,
  ReviewResponse,
  ReviewStatus,
  SubordinateKpi,
} from '../../../api/manager';

export type {
  KpiEvaluationDraft,
  MemberEvaluationContext,
  QuestionnaireDraftResponse,
  QuestionnaireValidationIssue,
  TeamEvaluationSubmissionStatus,
} from '../../../shared/evaluation';

export type { Team, TeamMember } from '../../../shared/api/mockData';

export interface TeamMemberEvaluationRow {
  member: TeamMember;
  teamName: string;
  evaluation: EvaluationHistoryItem | null;
  submissionStatus: TeamEvaluationSubmissionStatus;
  error?: string;
}

export interface MemberEvaluationWorkspace {
  member: TeamMember;
  teamName: string;
  evaluation: EvaluationHistoryItem;
  questions: EvaluationQuestion[];
  kpis: SubordinateKpi[];
  editable: boolean;
  lockReason: string | null;
}
