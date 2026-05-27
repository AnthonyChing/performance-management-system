import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  Settings, 
  Clock, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Edit,
  FileCheck
} from 'lucide-react';
import { loadManagerData, updateGoalStatus, addMockGoal, editGoal, evaluateGoal, saveManagerData } from '../api';
import type { ReviewItem } from '../types';

export default function Goals() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';

  const [data, setData] = useState(() => loadManagerData());
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
  const [rejectChanges, setRejectChanges] = useState<string>('');

  // Sync state if initialTeam router query parameter changes
  useEffect(() => {
    const queryTeam = searchParams.get('team');
    if (queryTeam) {
      setTeamFilter(queryTeam);
    }
  }, [searchParams]);

  const reloadData = () => {
    setData(loadManagerData());
  };

  const handleApprove = (id: string) => {
    const success = updateGoalStatus(id, '進行中');
    if (success) {
      reloadData();
    }
  };

  const handleReject = (id: string) => {
    const success = updateGoalStatus(id, '已否決');
    if (success) {
      reloadData();
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingGoal) return;
    
    // In a real app we'd save the reason & changes. Here we just update status to test.
    handleReject(rejectingGoal.id);

    setRejectingGoal(null);
    setRejectReason('');
    setRejectChanges('');
  };

  const handleReset = (id: string) => {
    const success = updateGoalStatus(id, '待審核');
    if (success) {
      reloadData();
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const memberSelected = data.members.find(m => m.id === newMember);
    addMockGoal({
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

  const handleEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.title.trim()) return;

    editGoal(editingGoal.id, {
      title: editingGoal.title,
      type: editingGoal.type,
      weight: editingGoal.type === 'KPI' ? editingGoal.weight : undefined,
      target: editingGoal.type === 'KPI' ? editingGoal.target : undefined,
      dueDate: editingGoal.dueDate,
    });

    setEditingGoal(null);
    reloadData();
  };

  const handleEvaluateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingGoal) return;

    evaluateGoal(evaluatingGoal.id, evaluationScore, evaluationComment);

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

  const renderGoalCard = (goal: ReviewItem) => {
    const isPending = goal.status === '待審核';
    const isActive = goal.status === '進行中';
    const isRejected = goal.status === '已否決';
    const isEvaluated = goal.status === '已評估';

    return (
      <div 
        key={goal.id} 
        className={`bg-white rounded-xl border p-6 shadow-sm transition-all hover:border-slate-300 flex flex-col justify-between gap-6 ${isPending ? 'border-amber-200 bg-amber-50/10' : ''}`}
      >
        {/* Top Part: Title & Employee Info */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Goal or KPI type mini tag */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${goal.type === 'KPI' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
              {goal.type}
            </span>
            
            {/* Status tag */}
            {isPending && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 待審核
              </span>
            )}
            {isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 待評分
              </span>
            )}
            {isEvaluated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> 已評估
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> 已否決
              </span>
            )}

            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 font-semibold">{goal.dueDate} 截止</span>
          </div>

          <h3 className="text-base font-bold text-slate-800 leading-tight">{goal.title}</h3>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">組員：{goal.memberName}</span>
            <span className="text-slate-300 text-xs">|</span>
            <span className="text-xs text-slate-500 font-medium">
              所屬：{data.teams.find(t => t.id === goal.teamId)?.name || '專案團隊'}
            </span>
          </div>

          {goal.type === 'KPI' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1.5 mt-2">
              <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-md">
                <span className="font-bold text-slate-500">KPI 權重</span>
                <span className="font-mono text-sm font-bold text-indigo-600">{goal.weight}%</span>
              </div>
              {goal.target && (
                <div className="bg-white p-2 border border-slate-100 rounded-md">
                  <span className="block font-bold text-slate-500 mb-1">目標量化值</span>
                  <span className="text-slate-700 font-medium">{goal.target}</span>
                </div>
              )}
            </div>
          )}

          {isEvaluated && (
            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1.5 mt-2 shadow-sm">
              <div className="font-bold text-indigo-800 flex items-center justify-between">
                <span>考核評分</span>
                <span className="font-mono text-base">{goal.score} 分</span>
              </div>
              <div className="pt-2 border-t border-indigo-100/50">
                <span className="font-bold text-slate-500 mb-1 block">主管期末評語：</span>
                <p className="text-slate-600 bg-white p-2 rounded border border-indigo-100/60 leading-relaxed italic">「{goal.evaluationComment}」</p>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Part: Quick Approval Controls */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {isPending && (
            <>
              <button
                onClick={() => {
                  setRejectingGoal(goal);
                  setRejectReason('');
                  setRejectChanges('');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-md shadow-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                否決退回
              </button>
              
              <button
                onClick={() => handleApprove(goal.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                同意核准
              </button>
            </>
          )}
          {isActive && (
            <button
              onClick={() => {
                setEvaluatingGoal(goal);
                setEvaluationScore(80);
                setEvaluationComment('');
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              進行期末考核評分
            </button>
          )}
          {isRejected && (
            <button
              onClick={() => handleReset(goal.id)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重置為待審核
            </button>
          )}
        </div>

      </div>
    );
  };

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
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold">沒有符合當前過濾條件的目標項目</p>
          <p className="text-xs mt-1">請嘗試清除搜尋字詞，或選擇其他組別分類。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: OKRs (Goals) */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-2 h-6 bg-purple-500 rounded-sm"></span> OKRs 發展目標
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {okrs.length > 0 ? okrs.map(renderGoalCard) : (
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
              {kpis.length > 0 ? kpis.map(renderGoalCard) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">沒有績效指標</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">指派／制訂同仁目標 & KPI</h3>
              <p className="text-xs text-slate-400 mt-1">您可以直接以此主管身份在團隊中加入一項指定或待審核的發展指標</p>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              
              {/* Assign to Employee */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">指派給同仁</label>
                <select
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none"
                >
                  {data.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">指標型態</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('KPI')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-colors ${newType === 'KPI' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-250 hover:bg-slate-50 text-slate-600'}`}
                  >
                    KPI 績效指標
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('目標')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-colors ${newType === '目標' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-250 hover:bg-slate-50 text-slate-600'}`}
                  >
                    OKRs 發展目標
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">目標 / KPI 標題</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 研究引進 GraphQL 提升行動網頁載入品質"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>

              {/* Weights and Targets (only for KPI) */}
              {newType === 'KPI' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">權重分比 (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">預期量化目標</label>
                    <input
                      type="text"
                      placeholder="如: FCP &lt; 1.5s"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Due date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">截止日期</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  確認建立
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                編輯同仁指標
              </h3>
              <p className="text-xs text-slate-400 mt-1">更新指標名稱、權重配置或預期目標。</p>
            </div>

            <form onSubmit={handleEditGoal} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">目標 / KPI 標題</label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>

              {editingGoal.type === 'KPI' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">權重分比 (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={editingGoal.weight || 0}
                      onChange={(e) => setEditingGoal({ ...editingGoal, weight: Number(e.target.value) })}
                      className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">預期量化目標</label>
                    <input
                      type="text"
                      value={editingGoal.target || ''}
                      onChange={(e) => setEditingGoal({ ...editingGoal, target: e.target.value })}
                      className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">截止日期</label>
                <input
                  type="date"
                  value={editingGoal.dueDate}
                  onChange={(e) => setEditingGoal({ ...editingGoal, dueDate: e.target.value })}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
                >
                  保存變更
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Evaluate Goal Modal */}
      {evaluatingGoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b border-indigo-100 bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                期末績效評估 (問卷與評分)
              </h3>
              <p className="text-xs text-indigo-700 mt-1">針對同仁 <b>{evaluatingGoal.memberName}</b> 的 【{evaluatingGoal.title}】 進行評分與評語撰寫。</p>
            </div>

            <form onSubmit={handleEvaluateGoal} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">評核分數 (0-100)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={evaluationScore}
                    onChange={(e) => setEvaluationScore(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-mono text-lg font-bold text-indigo-600 w-12 text-right">{evaluationScore}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">主管評估問卷 / 總結評語</label>
                <textarea
                  required
                  placeholder="請填寫同仁在此指標/項目中的具體表現，以及後續建議..."
                  value={evaluationComment}
                  onChange={(e) => setEvaluationComment(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 h-32 shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingGoal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  提交考核結果
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Reject Goal Modal */}
      {rejectingGoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b border-rose-100 bg-rose-50">
              <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                退回與否決
              </h3>
              <p className="text-xs text-rose-700 mt-1">針對 <b>{rejectingGoal.memberName}</b> 提出的【{rejectingGoal.title}】說明否決理由及修改建議。</p>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">否決原因 <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  placeholder="例如：此目標範疇過大，需切分至下個季度..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-rose-100 h-24 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">需要更改的部分 <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  placeholder="請列出明確需要調整的三項內容，以便同仁修改後重新提交..."
                  value={rejectChanges}
                  onChange={(e) => setRejectChanges(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-rose-100 h-24 shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingGoal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  確認退回
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
