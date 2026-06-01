import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  getMyHistoricalGoals,
  type EmployeeGoal,
  type EmployeePagination,
  type GoalCycleSummary,
  type GoalSummary,
} from '../api';

const PAGE_SIZE = 10;

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

  return '歷史目標載入失敗。';
}

function formatStatus(status: string | null | undefined) {
  if (!status) return '待處理';
  return statusLabels[status] ?? status;
}

function formatDate(value: string | null | undefined) {
  return value ?? '-';
}

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const label = formatStatus(status);
  const styles: Record<string, string> = {
    '進行中': 'bg-green-100 text-green-700',
    '待審核': 'bg-yellow-100 text-yellow-700',
    '已完成': 'bg-indigo-100 text-indigo-700',
    '需修改': 'bg-orange-100 text-orange-700',
    '已取消': 'bg-slate-100 text-slate-500',
    '待處理': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-3 ${styles[label] ?? 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
};

export default function PeriodHistoryGoals() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [cycle, setCycle] = useState<GoalCycleSummary | null>(null);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [pagination, setPagination] = useState<EmployeePagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId) {
      setIsLoading(false);
      setErrorMessage('缺少歷史考核週期 ID。');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadHistoricalGoals() {
      setIsLoading(true);

      try {
        const response = await getMyHistoricalGoals(
          {
            page,
            page_size: PAGE_SIZE,
            cycle_id: periodId,
          },
          { signal: controller.signal },
        );

        if (!isMounted) return;
        setGoals(response.goals ?? []);
        setCycle(response.cycle ?? null);
        setSummary(response.summary ?? null);
        setPagination(response.pagination);
        setErrorMessage(null);
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

    loadHistoricalGoals();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, page, periodId]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            歷史目標
            {cycle?.name && (
              <span className="font-normal text-slate-600 text-lg">（所屬考核週期：{cycle.name}）</span>
            )}
          </h1>
          <div className="text-sm text-slate-500 mt-1 flex px-1 breadcrumbs">
             主控台 <ChevronRight className="w-3 h-3 mx-1 mt-1" /> <Link to="/goals/history" className="hover:text-slate-800">歷史目標頁面</Link>
          </div>
        </div>
      </div>

      <PeriodHistoryGoalsContent
        isLoading={isLoading}
        errorMessage={errorMessage}
        goals={goals}
        periodId={periodId}
        summary={summary}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}

export function PeriodHistoryGoalsContent({
  isLoading,
  errorMessage,
  goals,
  periodId,
  summary,
  pagination,
  onPageChange,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  goals: EmployeeGoal[];
  periodId: string | undefined;
  summary: GoalSummary | null;
  pagination: EmployeePagination | null;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return <div className="text-sm text-slate-500">載入該期歷史目標中...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  return (
    <>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 font-medium">平均完成度</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.average_completion_percent ?? 0}%</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 font-medium">目標數量</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.goal_count ?? goals.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 font-medium">已完成</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.completed_count ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 font-medium">已取消</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.cancelled_count ?? 0}</p>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
          此考核週期尚無歷史目標。
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.progress_percent ?? 0;
            const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;

            return (
              <div key={goal.goal_id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center justify-between hover:border-black transition-colors">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-base font-bold text-slate-800">{goal.title}</h3>
                    <StatusBadge status={goal.status} />
                  </div>
                  {goal.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">截止日期：{formatDate(goal.due_date)}</p>
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
                  <Link to={`/goals/history/${periodId}/${goal.goal_id}`} className="flex items-center px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm group transition-colors">
                    查看詳情
                    <ChevronRight className="w-4 h-4 ml-2 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            type="button"
            disabled={!pagination.has_previous}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            aria-label="上一頁"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 h-8 flex items-center justify-center rounded bg-indigo-600 text-white font-medium text-sm">
            {pagination.page} / {pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={!pagination.has_next}
            onClick={() => onPageChange(Math.min(pagination.total_pages, pagination.page + 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            aria-label="下一頁"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
