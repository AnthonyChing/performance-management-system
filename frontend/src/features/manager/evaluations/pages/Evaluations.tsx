import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ClipboardCheck, Filter, Loader2, Search, User } from 'lucide-react';
import {
  ApiRequestError,
  createInitialKpiDrafts,
  createInitialQuestionnaireDraft,
  loadManagerEvaluationsDataAsync,
  loadMemberEvaluationWorkspace,
  loadTeamEvaluationStatuses,
  submitKpiEvaluation,
  submitQuestionnaireEvaluation,
  updateKpi,
} from '../api';
import type {
  KpiEvaluationDraft,
  MemberEvaluationWorkspace,
  QuestionnaireDraftResponse,
  RatingScale,
  TeamMemberEvaluationRow,
} from '../types';
import type { Team, TeamMember } from '../../../../shared/api/mockData';
import EvaluationPhaseBanner from '../components/EvaluationPhaseBanner';
import EvaluationsEmptyState from '../components/EvaluationsEmptyState';
import KpiScoringForm from '../components/KpiScoringForm';
import QuestionnaireForm from '../components/QuestionnaireForm';
import TeamEvaluationStatusTable from '../components/TeamEvaluationStatusTable';
import {
  toQuestionnairePayload,
  validateQuestionnaireResponses,
} from '../../../../shared/evaluation';

type WorkspaceTab = 'questionnaire' | 'kpis';

export default function Evaluations() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';
  const initialMember = searchParams.get('member');

  const [managerData, setManagerData] = useState<{ teams: Team[]; members: TeamMember[] }>({ teams: [], members: [] });
  const [managerDataLoaded, setManagerDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadManagerEvaluationsDataAsync().then(data => {
      if (mounted) {
        setManagerData(data);
        setManagerDataLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  const [teamFilter, setTeamFilter] = useState(initialTeam);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMember);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('questionnaire');

  const [statusRows, setStatusRows] = useState<TeamMemberEvaluationRow[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<MemberEvaluationWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const [questionnaireDraft, setQuestionnaireDraft] = useState<
    Record<string, QuestionnaireDraftResponse>
  >({});
  const [questionnaireErrors, setQuestionnaireErrors] = useState<Record<string, string>>({});
  const [kpiDrafts, setKpiDrafts] = useState<KpiEvaluationDraft[]>([]);
  const [finalRating, setFinalRating] = useState<RatingScale | ''>('');
  const [managerComment, setManagerComment] = useState('');

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const teamsById = useMemo(
    () => Object.fromEntries(managerData.teams.map((team) => [team.id, team.name])),
    [managerData.teams],
  );

  const filteredMembers = useMemo(() => {
    return managerData.members.filter((member) => {
      const matchesTeam = teamFilter === 'all' || member.teamId === teamFilter;
      const matchesSearch =
        searchQuery === '' ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTeam && matchesSearch;
    });
  }, [managerData.members, teamFilter, searchQuery]);

  const refreshStatuses = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const rows = await loadTeamEvaluationStatuses(filteredMembers, teamsById);
      setStatusRows(rows);
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : '無法載入團隊考核狀態';
      setStatusError(message);
      setStatusRows([]);
    } finally {
      setStatusLoading(false);
    }
  }, [filteredMembers, teamsById]);

  const refreshWorkspace = useCallback(async (memberId: string) => {
    const member = managerData.members.find((item) => item.id === memberId);
    if (!member) {
      setWorkspace(null);
      setWorkspaceError('找不到指定的部屬。');
      return;
    }

    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setActionMessage(null);
    setActionError(null);

    try {
      const loaded = await loadMemberEvaluationWorkspace(member, teamsById[member.teamId] ?? '—');
      if (!loaded) {
        setWorkspace(null);
        setWorkspaceError('此部屬尚無本期考核紀錄。');
        return;
      }

      setWorkspace(loaded);
      setQuestionnaireDraft(createInitialQuestionnaireDraft(loaded));
      setKpiDrafts(createInitialKpiDrafts(loaded));
      setFinalRating(loaded.evaluation.final_rating ?? '');
      setManagerComment(loaded.evaluation.manager_comment ?? '');
      setQuestionnaireErrors({});
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : '無法載入評核資料';
      setWorkspace(null);
      setWorkspaceError(message);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [managerData.members, teamsById]);

  useEffect(() => {
    const queryTeam = searchParams.get('team');
    if (queryTeam) {
      setTeamFilter(queryTeam);
    }
    const queryMember = searchParams.get('member');
    if (queryMember) {
      setSelectedMemberId(queryMember);
    }
  }, [searchParams]);

  useEffect(() => {
    if (managerDataLoaded) {
      void refreshStatuses();
    }
  }, [refreshStatuses, managerDataLoaded]);

  useEffect(() => {
    if (!selectedMemberId) {
      setWorkspace(null);
      return;
    }
    void refreshWorkspace(selectedMemberId);
  }, [selectedMemberId, refreshWorkspace]);

  const handleQuestionnaireChange = (
    questionId: string,
    patch: Partial<QuestionnaireDraftResponse>,
  ) => {
    setQuestionnaireDraft((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        question_id: questionId,
        ...patch,
      },
    }));
    setQuestionnaireErrors((current) => {
      if (!current[questionId]) return current;
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  const handleKpiChange = (kpiId: string, patch: Partial<KpiEvaluationDraft>) => {
    setKpiDrafts((current) =>
      current.map((draft) => (draft.kpi_id === kpiId ? { ...draft, ...patch } : draft)),
    );
  };

  const saveKpiCurrentValues = async (memberId: string) => {
    await Promise.all(
      kpiDrafts
        .filter((draft) => draft.current_value !== '')
        .map((draft) =>
          updateKpi(memberId, draft.kpi_id, {
            current_value: Number(draft.current_value),
          }),
        ),
    );
  };

  const handleSaveQuestionnaire = async () => {
    if (!workspace || !workspace.editable) return;

    const issues = validateQuestionnaireResponses(workspace.questions, questionnaireDraft);
    if (issues.length > 0) {
      setQuestionnaireErrors(
        Object.fromEntries(issues.map((issue) => [issue.question_id, issue.message])),
      );
      setActionError('請先完成所有必填的問卷題目。');
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await submitQuestionnaireEvaluation(workspace.member.id, workspace.evaluation.id, {
        responses: toQuestionnairePayload(questionnaireDraft),
      });
      setActionMessage('問卷評估已儲存。');
      await refreshWorkspace(workspace.member.id);
      await refreshStatuses();
    } catch (error) {
      setActionError(error instanceof ApiRequestError ? error.message : '問卷儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKpiDraft = async () => {
    if (!workspace || !workspace.editable) return;

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await saveKpiCurrentValues(workspace.member.id);
      await submitKpiEvaluation(workspace.member.id, workspace.evaluation.id, {
        status: 'manager_eval_in_progress',
        manager_comment: managerComment || undefined,
        kpi_evaluations: kpiDrafts.map((draft) => ({
          kpi_id: draft.kpi_id,
          manager_feedback: draft.manager_feedback || undefined,
        })),
      });
      setActionMessage('KPI 目前數值已暫存。');
      await refreshWorkspace(workspace.member.id);
      await refreshStatuses();
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'STATE_CONFLICT') {
        setActionError('目前不在主管評核階段，無法儲存 KPI 目前數值。');
      } else {
        setActionError(error instanceof ApiRequestError ? error.message : 'KPI 暫存失敗');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!workspace || !workspace.editable) return;

    const questionnaireIssues = validateQuestionnaireResponses(
      workspace.questions,
      questionnaireDraft,
    );
    if (questionnaireIssues.length > 0) {
      setActiveTab('questionnaire');
      setQuestionnaireErrors(
        Object.fromEntries(
          questionnaireIssues.map((issue) => [issue.question_id, issue.message]),
        ),
      );
      setActionError('提交前請先完成問卷必填項目。');
      return;
    }

    if (!finalRating) {
      setActiveTab('kpis');
      setActionError('提交前請選擇綜合評等。');
      return;
    }

    const incompleteKpis = kpiDrafts.filter((draft) => draft.current_value === '');
    if (workspace.kpis.length > 0 && incompleteKpis.length > 0) {
      setActiveTab('kpis');
      setActionError('提交前請完成所有 KPI 目前數值。');
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await submitQuestionnaireEvaluation(workspace.member.id, workspace.evaluation.id, {
        responses: toQuestionnairePayload(questionnaireDraft),
      });
      await saveKpiCurrentValues(workspace.member.id);
      await submitKpiEvaluation(workspace.member.id, workspace.evaluation.id, {
        status: 'completed',
        final_rating: finalRating,
        manager_comment: managerComment || undefined,
        kpi_evaluations: kpiDrafts.map((draft) => ({
          kpi_id: draft.kpi_id,
          manager_feedback: draft.manager_feedback || undefined,
        })),
      });
      setActionMessage('最終評核已提交。');
      await refreshWorkspace(workspace.member.id);
      await refreshStatuses();
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'STATE_CONFLICT') {
        setActionError('目前不在主管評核階段，無法提交最終評核。');
      } else {
        setActionError(error instanceof ApiRequestError ? error.message : '提交失敗');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRow = statusRows.find((row) => row.member.id === selectedMemberId);

  return (
    <div className="w-full space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">團隊績效評估</h1>
        <p className="text-slate-500 text-sm mt-1">
          檢視部屬考核進度，完成問卷評估與 KPI 目前數值，並遵守各階段鎖定規則。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          篩選條件
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋員工姓名或職稱..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg pl-9 pr-4 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">所有組別</option>
            {managerData.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end text-xs text-slate-400 font-semibold pr-2">
            共 {filteredMembers.length} 位部屬
          </div>
        </div>
      </div>

      {statusError && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {statusError}
        </div>
      )}

      {statusLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          載入團隊考核狀態中...
        </div>
      ) : statusRows.length === 0 ? (
        <EvaluationsEmptyState />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
          <TeamEvaluationStatusTable
            rows={statusRows}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
          />

          <div className="space-y-4">
            {!selectedMemberId ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">
                請從左側清單選擇一位部屬以開始評核。
              </div>
            ) : workspaceLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                載入評核表單中...
              </div>
            ) : workspaceError ? (
              <div className="bg-white rounded-xl border border-rose-100 p-8 text-center space-y-2">
                <User className="w-8 h-8 text-rose-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {selectedRow?.member.name ?? '部屬'}
                </p>
                <p className="text-xs text-rose-600">{workspaceError}</p>
              </div>
            ) : workspace ? (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={workspace.member.avatar}
                      alt={workspace.member.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{workspace.member.name}</h2>
                      <p className="text-xs text-slate-500">
                        {workspace.teamName} · {workspace.member.role}
                      </p>
                    </div>
                  </div>
                </div>

                <EvaluationPhaseBanner
                  editable={workspace.editable}
                  lockReason={workspace.lockReason}
                />

                {(actionMessage || actionError) && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-xs flex items-center gap-2 ${
                      actionError
                        ? 'border-rose-100 bg-rose-50 text-rose-700'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {actionError ?? actionMessage}
                  </div>
                )}

                <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
                  {[
                    { id: 'questionnaire' as const, label: '問卷評估' },
                    { id: 'kpis' as const, label: 'KPI 數值與總結' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'questionnaire' ? (
                  <div className="space-y-4">
                    <QuestionnaireForm
                      questions={workspace.questions}
                      draft={questionnaireDraft}
                      fieldErrors={questionnaireErrors}
                      disabled={!workspace.editable || isSaving}
                      onChange={handleQuestionnaireChange}
                    />
                    {workspace.editable && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void handleSaveQuestionnaire()}
                          className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          儲存問卷
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <KpiScoringForm
                    kpis={workspace.kpis}
                    kpiDrafts={kpiDrafts}
                    finalRating={finalRating}
                    managerComment={managerComment}
                    disabled={!workspace.editable || isSaving}
                    onKpiChange={handleKpiChange}
                    onFinalRatingChange={setFinalRating}
                    onManagerCommentChange={setManagerComment}
                    onSaveDraft={() => void handleSaveKpiDraft()}
                    onSubmitFinal={() => void handleSubmitFinal()}
                    isSaving={isSaving}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
