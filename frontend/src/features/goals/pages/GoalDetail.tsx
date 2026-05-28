import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Edit3,
  MessageSquare,
  Rocket,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  getMyCurrentGoals,
  updateMyGoalProgress,
  type EmployeeGoal,
  type EmployeeGoalUpdateResult,
} from '../api';

const statusLabels: Record<string, string> = {
  in_progress: '進行中',
  pending_review: '待審核',
  draft: '草稿',
  completed: '已完成',
  revision_requested: '需修改',
  cancelled: '已取消',
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 401 &&
    error.code === 'UNAUTHORIZED'
  );
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 && error.code === 'UNAUTHORIZED') {
      return '尚未登入或 token 失效。';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '目標詳情載入失敗。';
}

function formatStatus(status: string | null | undefined) {
  if (!status) {
    return '待處理';
  }

  return statusLabels[status] ?? status;
}

function formatDate(value: string | null | undefined) {
  return value ?? '-';
}

function clampProgress(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

function mergeGoalUpdate(goal: EmployeeGoal, update: EmployeeGoalUpdateResult): EmployeeGoal {
  return {
    ...goal,
    ...update,
    title: update.title ?? goal.title,
    description: update.description ?? goal.description,
  };
}

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const label = formatStatus(status);
  const styles: Record<string, string> = {
    '進行中': 'bg-green-100 text-green-700',
    '待審核': 'bg-yellow-100 text-yellow-700',
    '草稿': 'bg-slate-100 text-slate-600',
    '已完成': 'bg-indigo-100 text-indigo-700',
    '需修改': 'bg-orange-100 text-orange-700',
    '已取消': 'bg-slate-100 text-slate-500',
    '待處理': 'bg-orange-100 text-orange-700',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${
        styles[label] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  );
};

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [goal, setGoal] = useState<EmployeeGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadGoalDetail() {
      try {
        const response = await getMyCurrentGoals({ signal: controller.signal });
        const matchedGoal = response.goals.find((item) => item.goal_id === id) ?? null;

        if (!isMounted) return;
        setGoal(matchedGoal);
        setProgress(clampProgress(matchedGoal?.progress_percent));
        setNote('');
        setErrorMessage(matchedGoal ? null : '找不到此目標。');
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          const redirectPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGoalDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, location.pathname, location.search, navigate]);

  async function handleUpdateProgress() {
    if (!goal) return;

    try {
      setIsSubmitting(true);
      setSubmitErrorMessage(null);
      const response = await updateMyGoalProgress(goal.goal_id, {
        progress_percent: progress,
        note: note.trim(),
      });

      setGoal((current) => (
        current ? mergeGoalUpdate(current, response.goal) : current
      ));
      setProgress(clampProgress(response.goal.progress_percent));
      setNote('');
      setIsModalOpen(false);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }

      setSubmitErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">載入目標詳情中...</div>;
  }

  if (errorMessage || !goal) {
    return <div className="text-sm text-red-700">{errorMessage ?? '找不到此目標。'}</div>;
  }

  const currentProgress = clampProgress(goal.progress_percent);
  const latestUpdate = goal.latest_progress_update;
  const latestReview = goal.latest_review;
  const reviewer = latestReview?.reviewer ?? goal.reviewer;
  const canEdit = Boolean(goal.available_actions?.can_edit);
  const canUpdateProgress = Boolean(goal.available_actions?.can_update_progress);

  return (
    <div className="w-full max-w-4xl relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{goal.title}</h1>
            <StatusBadge status={goal.status} />
          </div>
          <div className="flex items-center text-sm text-slate-500 font-medium">
             <Calendar className="w-4 h-4 mr-1.5" />
             截止日期： {formatDate(goal.due_date)}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Link to={`/goals/edit/${goal.goal_id}`} className="flex items-center px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 shadow-sm">
              <Edit3 className="w-4 h-4 mr-2" />
              修改目標
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center px-4 py-2 bg-white text-slate-400 text-sm font-medium rounded-lg border border-slate-200 cursor-not-allowed"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              修改目標
            </button>
          )}
          <button
            onClick={() => {
              setProgress(currentProgress);
              setNote('');
              setSubmitErrorMessage(null);
              setIsModalOpen(true);
            }}
            disabled={!canUpdateProgress}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket className="w-4 h-4 mr-2" />
            更新進度
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6 p-6">
         <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">目標說明</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
               {goal.description ?? '尚未提供目標說明。'}
            </p>
         </div>

         <div>
            <div className="flex justify-between items-end mb-2 border-t border-slate-100 pt-6">
               <h3 className="text-sm font-semibold text-slate-800">當前進度狀態</h3>
               <span className="text-2xl font-bold text-slate-900">{currentProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
               <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${currentProgress}%` }}></div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="w-full sm:w-1/3 shrink-0">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">上次更新時間</span>
                     <span className="text-sm font-medium text-slate-800">{formatDate(latestUpdate?.created_at)}</span>
                  </div>
                  <div className="w-full sm:flex-1">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">備註</span>
                     <p className="text-sm text-slate-700 leading-relaxed">
                        {latestUpdate?.note ?? '目前尚無進度備註。'}
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
         <div className="flex items-center text-slate-800 font-bold mb-4">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
            主管審核回饋
         </div>

         {latestReview ? (
           <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-600">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-sm font-bold text-indigo-900">
                   {reviewer?.name ?? '主管'}{reviewer?.title ? ` (${reviewer.title})` : ''}
                 </span>
                 <span className="text-xs text-slate-400 font-medium">
                   {formatDate(latestReview.reviewed_at)}
                 </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                 {latestReview.comment ?? '主管尚未留下文字回饋。'}
              </p>
           </div>
         ) : (
           <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-500">
             目前尚無主管審核回饋。
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">更新目標進度</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">GOAL NAME</p>
                <p className="text-sm font-bold text-slate-800 mb-4">{goal.title}</p>
                
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span>目前進度: {currentProgress}%</span>
                  <div className="flex items-center text-right">
                    <span className="font-bold text-slate-800 mr-4 text-sm">{progress}%</span>
                    <div className="flex flex-col">
                       <span className="text-[10px]">上次更新</span>
                       <span className="font-bold text-slate-800">{formatDate(latestUpdate?.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 flex overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-l-full" style={{ width: `${currentProgress}%` }}></div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">設置新進度</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(event) => setProgress(Number.parseInt(event.target.value, 10))}
                    className="flex-1 accent-indigo-600"
                  />
                  <div className="flex items-center gap-2 border border-slate-300 rounded overflow-hidden">
                     <input
                       type="number"
                       min="0"
                       max="100"
                       value={progress}
                       onChange={(event) => setProgress(clampProgress(Number.parseInt(event.target.value, 10)))}
                       className="w-16 p-2 text-center text-sm font-bold text-slate-800 outline-none"
                     />
                     <span className="text-sm text-slate-500 font-bold bg-slate-50 px-3 py-2 border-l border-slate-300">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">進度說明與備註</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full h-24 p-3 text-sm border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="描述當前狀態、取得的成就或面臨的挑戰..."
                ></textarea>
              </div>

              {submitErrorMessage && (
                <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {submitErrorMessage}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={isSubmitting || !note.trim()}
                className="flex items-center px-6 py-2 bg-[#0c4a8f] text-white rounded font-medium hover:bg-[#09366e] text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? '提交中...' : '確認更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
