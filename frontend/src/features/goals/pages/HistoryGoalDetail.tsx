import React, { useEffect, useState } from 'react';
import { MessageSquare, Calendar } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  getMyHistoricalGoals,
  type EmployeeGoal,
  type GoalCycleSummary,
} from '../api';

const DETAIL_PAGE_SIZE = 100;

const statusLabels: Record<string, string> = {
  in_progress: '進行中',
  pending_review: '待審核',
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

  return '歷史目標詳情載入失敗。';
}

function formatStatus(status: string | null | undefined) {
  if (!status) return '待處理';
  return statusLabels[status] ?? status;
}

function formatDate(value: string | null | undefined) {
  return value ?? '-';
}

function formatReviewer(goal: EmployeeGoal) {
  const reviewer = goal.latest_review?.reviewer ?? goal.reviewer;
  if (!reviewer?.name) return '主管';
  return reviewer.title ? `${reviewer.name} (${reviewer.title})` : reviewer.name;
}

async function findHistoricalGoal(
  cycleId: string,
  goalId: string,
  signal: AbortSignal,
) {
  let page = 1;
  let cycle: GoalCycleSummary | null = null;

  while (true) {
    const response = await getMyHistoricalGoals(
      {
        page,
        page_size: DETAIL_PAGE_SIZE,
        cycle_id: cycleId,
      },
      { signal },
    );
    cycle = response.cycle ?? cycle;

    const goal = (response.goals ?? []).find((item) => item.goal_id === goalId);
    if (goal) {
      return { cycle, goal };
    }

    if (!response.pagination.has_next) {
      return { cycle, goal: null };
    }

    page += 1;
  }
}

export default function HistoryGoalDetail() {
  const { periodId, goalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cycle, setCycle] = useState<GoalCycleSummary | null>(null);
  const [goal, setGoal] = useState<EmployeeGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId || !goalId) {
      setIsLoading(false);
      setErrorMessage('缺少歷史考核週期或目標 ID。');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadHistoricalGoalDetail() {
      setIsLoading(true);

      try {
        const result = await findHistoricalGoal(periodId, goalId, controller.signal);

        if (!isMounted) return;
        setCycle(result.cycle);
        setGoal(result.goal);
        setErrorMessage(result.goal ? null : '找不到指定的歷史目標。');
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

    loadHistoricalGoalDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [goalId, location.pathname, location.search, navigate, periodId]);

  if (isLoading) {
    return <div className="text-sm text-slate-500">載入歷史目標詳情中...</div>;
  }

  if (errorMessage || !goal) {
    return <div className="text-sm text-red-700">{errorMessage ?? '找不到指定的歷史目標。'}</div>;
  }

  const progress = goal.progress_percent ?? 0;
  const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;
  const latestProgress = goal.latest_progress_update;
  const latestReview = goal.latest_review;

  return (
    <div className="w-full max-w-4xl relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {goal.title}
              {cycle?.name && (
                <span className="font-normal text-slate-600 text-lg">（所屬考核週期：{cycle.name}）</span>
              )}
            </h1>
          </div>
          <div className="flex items-center text-sm text-slate-500 font-medium">
             <Calendar className="w-4 h-4 mr-1.5" />
             截止日期： {formatDate(goal.due_date)}
             <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
               {formatStatus(goal.status)}
             </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6 p-6">
         <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">目標說明</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
               {goal.description || '此目標未提供說明。'}
            </p>
         </div>

         <div>
            <div className="flex justify-between items-end mb-2 border-t border-slate-100 pt-6">
               <h3 className="text-sm font-semibold text-slate-800">當前進度狀態</h3>
               <span className="text-2xl font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
               <div className="bg-indigo-600 h-3 rounded-full" style={{ width: progressWidth }}></div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="w-full sm:w-1/3 shrink-0">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">上次更新時間</span>
                     <span className="text-sm font-medium text-slate-800">{formatDate(latestProgress?.created_at)}</span>
                  </div>
                  <div className="w-full sm:flex-1">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">備註</span>
                     <p className="text-sm text-slate-700 leading-relaxed">
                        {latestProgress?.note || '尚無進度更新備註。'}
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
         <div className="flex items-center text-slate-800 font-bold mb-4">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
            主管回饋
         </div>

         <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-600">
            <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-indigo-900">{formatReviewer(goal)}</span>
               <span className="text-xs text-slate-400 font-medium">{formatDate(latestReview?.reviewed_at)}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
               {latestReview?.comment || '尚無主管回饋。'}
            </p>
         </div>
      </div>
    </div>
  );
}
