import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { loadManagerDataAsync, updateGoalStatusAsync, addMockGoalAsync, editGoalAsync, evaluateGoalAsync } from '../api';
import type { ReviewItem } from '../types';
import AddGoalModal from '../components/AddGoalModal';
import EditGoalModal from '../components/EditGoalModal';
import EvaluateGoalModal from '../components/EvaluateGoalModal';
import GoalCard from '../components/GoalCard';
import GoalsEmptyState from '../components/GoalsEmptyState';
import RejectGoalModal from '../components/RejectGoalModal';

export default function Goals() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';

  const [data, setData] = useState<{teams: any[], members: any[], goals: any[]}>({ teams: [], members: [], goals: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>(initialTeam);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('待審核');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for adding goal
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'目標' | 'KPI'>('KPI');
  const [newMember, setNewMember] = useState('m1');
  const [newWeight, setNewWeight] = useState(30);
  const [newTarget, setNewTarget] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-06-30');

  // Edit State
  const [editingGoal, setEditingGoal] = useState<ReviewItem | null>(null);

  // Evaluate State
  const [evaluatingGoal, setEvaluatingGoal] = useState<ReviewItem | null>(null);
  const [evaluationScore, setEvaluationScore] = useState<number>(80);
  const [evaluationComment, setEvaluationComment] = useState<string>('');

  // Reject State
  const [rejectingGoal, setRejectingGoal] = useState<ReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Sync state if initialTeam router query parameter changes
  useEffect(() => {
    const queryTeam = searchParams.get('team');
    if (queryTeam) {
      setTeamFilter(queryTeam);
    }
  }, [searchParams]);

  const reloadData = async () => {
    setIsLoading(true);
    const result = await loadManagerDataAsync();
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleApprove = async (id: string) => {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;
    const success = await updateGoalStatusAsync(id, goal.memberId, '進行中');
    if (success) {
      reloadData();
    }
  };

  const handleReject = async (id: string) => {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;
    const success = await updateGoalStatusAsync(id, goal.memberId, '已否決');
    if (success) {
      reloadData();
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingGoal) return;
    
    await handleReject(rejectingGoal.id);

    setRejectingGoal(null);
    setRejectReason('');
  };

  const handleReset = async (id: string) => {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;
    const success = await updateGoalStatusAsync(id, goal.memberId, '待審核');
    if (success) {
      reloadData();
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const memberSelected = data.members.find(m => m.id === newMember);
    await addMockGoalAsync({
      title: newTitle,
      type: newType,
      memberId: newMember,
      memberName: memberSelected?.name || '陳大文',
      teamId: memberSelected?.teamId || 'tech-a',
      weight: newType === 'KPI' ? newWeight : undefined,
      target: newType === 'KPI' ? newTarget : undefined,
      dueDate: newDueDate,
      status: '待審核'
    });

    setNewTitle('');
    setNewTarget('');
    setShowAddModal(false);
    reloadData();
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.title.trim()) return;

    await editGoalAsync(editingGoal.id, editingGoal.memberId, {
      title: editingGoal.title,
      type: editingGoal.type,
      weight: editingGoal.type === 'KPI' ? editingGoal.weight : undefined,
      target: editingGoal.type === 'KPI' ? editingGoal.target : undefined,
      dueDate: editingGoal.dueDate,
    });

    setEditingGoal(null);
    reloadData();
  };

  const handleEvaluateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingGoal) return;

    await evaluateGoalAsync(evaluatingGoal.id, evaluatingGoal.memberId, evaluationScore, evaluationComment);

    setEvaluatingGoal(null);
    setEvaluationScore(80);
    setEvaluationComment('');
    reloadData();
  };

  // Filter computation
  const filteredGoals = data.goals.filter(g => {
    const matchesTeam = teamFilter === 'all' || g.teamId === teamFilter;
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesName = searchQuery === '' || 
      g.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesStatus && matchesName;
  });

  const okrs = filteredGoals.filter(g => g.type === '目標');
  const kpis = filteredGoals.filter(g => g.type === 'KPI');

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">載入中...</div>;
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">目標 / KPI 審查管理</h1>
          <p className="text-slate-500 text-sm mt-1">
            設定並核准或修正直屬同仁提出的本期目標與指標。可按組別過濾快速批閱。
          </p>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 mb-6">
        {[
          { id: '待審核', label: '待核准 (Pending)' },
          { id: '進行中', label: '待評分' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              statusFilter === tab.id 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          關鍵字與條件篩選
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋員工姓名或目標標題..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg pl-9 pr-4 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">所有組別部門</option>
              {data.teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Summary counters inside filters */}
          <div className="flex items-center justify-end text-xs text-slate-400 font-semibold pr-2">
            篩選出 {filteredGoals.length} 項指標 / 目標
          </div>

        </div>
      </div>

      {/* Grid of Goals & KPIs */}
      {filteredGoals.length === 0 ? (
        <GoalsEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: OKRs (Goals) */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-2 h-6 bg-purple-500 rounded-sm"></span> OKRs 發展目標
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {okrs.length > 0 ? okrs.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  teamName={data.teams.find((team) => team.id === goal.teamId)?.name || '專案團隊'}
                  onApprove={handleApprove}
                  onReject={(target) => {
                    setRejectingGoal(target);
                    setRejectReason('');
                  }}
                  onEvaluate={(target) => {
                    setEvaluatingGoal(target);
                    setEvaluationScore(80);
                    setEvaluationComment('');
                  }}
                  onReset={handleReset}
                />
              )) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">沒有發展目標</div>
              )}
            </div>
          </div>

          {/* Right Column: KPIs */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-2 h-6 bg-indigo-500 rounded-sm"></span> KPI 績效指標
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {kpis.length > 0 ? kpis.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  teamName={data.teams.find((team) => team.id === goal.teamId)?.name || '專案團隊'}
                  onApprove={handleApprove}
                  onReject={(target) => {
                    setRejectingGoal(target);
                    setRejectReason('');
                  }}
                  onEvaluate={(target) => {
                    setEvaluatingGoal(target);
                    setEvaluationScore(80);
                    setEvaluationComment('');
                  }}
                  onReset={handleReset}
                />
              )) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">沒有績效指標</div>
              )}
            </div>
          </div>

        </div>
      )}

      {showAddModal && (
        <AddGoalModal
          members={data.members}
          newTitle={newTitle}
          newType={newType}
          newMember={newMember}
          newWeight={newWeight}
          newTarget={newTarget}
          newDueDate={newDueDate}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateGoal}
          onTypeChange={setNewType}
          onMemberChange={setNewMember}
          onTitleChange={setNewTitle}
          onWeightChange={setNewWeight}
          onTargetChange={setNewTarget}
          onDueDateChange={setNewDueDate}
        />
      )}

      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={handleEditGoal}
          onChange={setEditingGoal}
        />
      )}

      {evaluatingGoal && (
        <EvaluateGoalModal
          goal={evaluatingGoal}
          evaluationScore={evaluationScore}
          evaluationComment={evaluationComment}
          onScoreChange={setEvaluationScore}
          onCommentChange={setEvaluationComment}
          onClose={() => setEvaluatingGoal(null)}
          onSubmit={handleEvaluateGoal}
        />
      )}

      {rejectingGoal && (
        <RejectGoalModal
          goal={rejectingGoal}
          rejectReason={rejectReason}
          onReasonChange={setRejectReason}
          onClose={() => setRejectingGoal(null)}
          onSubmit={handleRejectSubmit}
        />
      )}

    </div>
  );
}
