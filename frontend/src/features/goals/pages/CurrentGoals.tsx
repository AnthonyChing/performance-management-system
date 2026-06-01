import React, { useEffect, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ApiRequestError,
  getMyCurrentGoals,
  type CurrentGoalsResponse,
  type EmployeeGoal,
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

function isNoCurrentCycleError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    (error.code === 'CYCLE_NOT_FOUND' || error.code === 'CURRENT_CYCLE_NOT_FOUND')
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

  return '本期目標載入失敗。';
}

function formatDate(value: string | null | undefined) {
  return value ?? '-';
}

function formatStatus(status: string | null | undefined) {
  if (!status) {
    return '待處理';
  }

  return statusLabels[status] ?? status;
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
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-3 ${
        styles[label] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  );
};

export default function CurrentGoals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [goalsData, setGoalsData] = useState<CurrentGoalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadCurrentGoals() {
      try {
        const response = await getMyCurrentGoals({ signal: controller.signal });

        if (!isMounted) return;
        setGoalsData(response);
        setErrorMessage(null);
        setEmptyMessage(null);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          const redirectPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
          return;
        }

        if (isNoCurrentCycleError(error)) {
          setGoalsData(null);
          setErrorMessage(null);
          setEmptyMessage('目前沒有可顯示的考核週期。');
          return;
        }

        setErrorMessage(getApiErrorMessage(error));
        setEmptyMessage(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentGoals();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate]);

  const canCreateGoal = !emptyMessage && goalsData?.available_actions?.can_create_goal !== false;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">本期目標</h1>
          {goalsData?.cycle.period_label && (
            <p className="mt-1 text-sm text-slate-500">{goalsData.cycle.period_label}</p>
          )}
          <div className="text-sm text-slate-500 mt-1 flex px-1 breadcrumbs">
             主控台 <ChevronRight className="w-3 h-3 mx-1 mt-1" /> 目前目標頁面
          </div>
        </div>
        {canCreateGoal ? (
          <Link to="/goals/new" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            新增目標
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center px-4 py-2 bg-slate-200 text-slate-500 rounded-md text-sm font-medium cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增目標
          </button>
        )}
      </div>

      <CurrentGoalsContent
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage={emptyMessage}
        goals={goalsData?.goals ?? []}
      />
    </div>
  );
}

export function CurrentGoalsContent({
  isLoading,
  errorMessage,
  emptyMessage,
  goals,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  emptyMessage?: string | null;
  goals: EmployeeGoal[];
}) {
  if (isLoading) {
    return <div className="text-sm text-slate-500">載入本期目標中...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        {emptyMessage ?? '目前尚未建立本期目標。'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = goal.progress_percent ?? 0;
        const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;

        return (
          <div key={goal.goal_id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center justify-between hover:border-slate-300 transition-colors">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-base font-bold text-slate-800">{goal.title}</h3>
                <StatusBadge status={goal.status} />
              </div>
              {goal.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                截止日期：{formatDate(goal.due_date)}
              </p>
            </div>
            
            <div className="flex-1 px-8">
               <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                  <span>當前進度</span>
                  <span className="font-bold text-slate-800">{progress}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: progressWidth }}></div>
               </div>
            </div>

            <div className="w-32 flex justify-end">
                  <Link to={`/goals/${goal.goal_id}`} className="flex items-center px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm group transition-colors">
                     查看詳情
                     <ChevronRight className="w-4 h-4 ml-2 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
