import {
  ApiRequestError,
  listEvaluations,
  listKpis,
  submitKpiEvaluation,
  submitQuestionnaireEvaluation,
  listMySubordinates,
} from '../../../api/manager';
import {
  buildQuestionnaireDraftFromResponses,
  deriveSubmissionStatus,
  isManagerEvaluationEditable,
  getManagerEvaluationLockReason,
  resolveEvaluationQuestions,
} from '../../../shared/evaluation';
import type { Team, TeamMember } from '../../../shared/api/mockData';
import type { EvaluationHistoryItem } from '../../../api/manager';
import type { MemberEvaluationWorkspace, TeamMemberEvaluationRow } from './types';

export {
  ApiRequestError,
  listEvaluations,
  listKpis,
  submitKpiEvaluation,
  submitQuestionnaireEvaluation,
};

export async function loadManagerDataAsync(): Promise<{ teams: Team[]; members: TeamMember[] }> {
  try {
    const res = await listMySubordinates();
    
    const members: TeamMember[] = res.data.map(sub => ({
      id: sub.id,
      name: sub.name,
      teamId: sub.department || 'General',
      role: sub.job_title || 'Employee',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&background=random`,
      email: sub.email,
      progress: 0,
      goalsCount: 0
    }));

    const teamIds = Array.from(new Set(members.map(m => m.teamId)));
    const teams: Team[] = teamIds.map(tid => ({
      id: tid,
      name: tid,
      manager: 'You',
      memberCount: members.filter(m => m.teamId === tid).length,
      avgProgress: 0
    }));

    return { teams, members };
  } catch (error) {
    console.error('Failed to load manager data', error);
    return { teams: [], members: [] };
  }
}

function pickCurrentEvaluation(evaluations: EvaluationHistoryItem[]): EvaluationHistoryItem | null {
  if (evaluations.length === 0) return null;

  const editable = evaluations.find((item) => isManagerEvaluationEditable(item.status));
  if (editable) return editable;

  const sorted = [...evaluations].sort((a, b) => {
    const aTime = a.updated_at ?? a.manager_submitted_at ?? '';
    const bTime = b.updated_at ?? b.manager_submitted_at ?? '';
    return bTime.localeCompare(aTime);
  });

  return sorted[0] ?? null;
}

export async function loadTeamEvaluationStatuses(
  members: TeamMember[],
  teamsById: Record<string, string>,
  cycleId?: string,
): Promise<TeamMemberEvaluationRow[]> {
  const results = await Promise.all(
    members.map(async (member) => {
      try {
        const { data } = await listEvaluations(member.id, cycleId ? { cycle_id: cycleId } : {});
        const evaluation = pickCurrentEvaluation(data);
        return {
          member,
          teamName: teamsById[member.teamId] ?? '—',
          evaluation,
          submissionStatus: deriveSubmissionStatus(evaluation),
        } satisfies TeamMemberEvaluationRow;
      } catch (error) {
        const message =
          error instanceof ApiRequestError ? error.message : '無法載入考核狀態';
        return {
          member,
          teamName: teamsById[member.teamId] ?? '—',
          evaluation: null,
          submissionStatus: 'locked' as const,
          error: message,
        } satisfies TeamMemberEvaluationRow;
      }
    }),
  );

  return results;
}

export async function loadMemberEvaluationWorkspace(
  member: TeamMember,
  teamName: string,
  cycleId?: string,
): Promise<MemberEvaluationWorkspace | null> {
  const [{ data: evaluations }, { data: kpis }] = await Promise.all([
    listEvaluations(member.id, cycleId ? { cycle_id: cycleId } : {}),
    listKpis(member.id, cycleId ? { cycle_id: cycleId } : {}),
  ]);

  const evaluation = pickCurrentEvaluation(evaluations);
  if (!evaluation) {
    return null;
  }

  const responseQuestionIds =
    evaluation.responses?.map((response) => response.question_id) ?? [];
  const questions = resolveEvaluationQuestions(evaluation.questions, responseQuestionIds);
  const editable = isManagerEvaluationEditable(evaluation.status);

  return {
    member,
    teamName,
    evaluation,
    questions,
    kpis,
    editable,
    lockReason: getManagerEvaluationLockReason(evaluation.status),
  };
}

export function createInitialQuestionnaireDraft(
  workspace: MemberEvaluationWorkspace,
): Record<string, import('../../../shared/evaluation').QuestionnaireDraftResponse> {
  return buildQuestionnaireDraftFromResponses(
    workspace.questions,
    workspace.evaluation.responses ?? [],
  );
}

export function createInitialKpiDrafts(
  workspace: MemberEvaluationWorkspace,
): import('./types').KpiEvaluationDraft[] {
  const existingByKpiId = new Map(
    (workspace.evaluation.kpi_evaluations ?? []).map((item) => [item.kpi_id, item]),
  );

  return workspace.kpis.map((kpi) => {
    const existing = existingByKpiId.get(kpi.id);
    return {
      kpi_id: kpi.id,
      manager_score: existing?.manager_score ?? '',
      manager_feedback: existing?.manager_feedback ?? '',
    };
  });
}
