import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ApiRequestError,
  getMyHistoricalGoals,
  type GoalCycleSummary,
  type EmployeePagination,
} from '../api';

const PAGE_SIZE = 10;

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

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (start && end) return `${start} 至 ${end}`;
  return start ?? end ?? '-';
}

function formatNumber(value: number | null | undefined) {
  return value ?? 0;
}

export default function HistoryGoals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cycles, setCycles] = useState<GoalCycleSummary[]>([]);
  const [pagination, setPagination] = useState<EmployeePagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadHistoricalCycles() {
      setIsLoading(true);

      try {
        const response = await getMyHistoricalGoals(
          { page, page_size: PAGE_SIZE },
          { signal: controller.signal },
        );

        if (!isMounted) return;
        setCycles(response.historical_cycles ?? []);
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

    loadHistoricalCycles();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, page]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">歷史目標列表</h1>
        <p className="text-slate-500 text-sm mt-1">查閱過去所有考核週期的目標</p>
      </div>

      <HistoryGoalsContent
        isLoading={isLoading}
        errorMessage={errorMessage}
        cycles={cycles}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}

export function HistoryGoalsContent({
  isLoading,
  errorMessage,
  cycles,
  pagination,
  onPageChange,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  cycles: GoalCycleSummary[];
  pagination: EmployeePagination | null;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return <div className="text-sm text-slate-500">載入歷史目標中...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (cycles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        目前尚無歷史目標資料。
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mb-8">
        {cycles.map((item) => (
          <div key={item.cycle_id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1 mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <span className="text-slate-400 mr-2">考核區間：</span>
                {formatDateRange(item.start_date, item.end_date)}
              </p>
              {item.period_label && (
                <p className="text-xs text-slate-400 mt-1">{item.period_label}</p>
              )}
            </div>

            <div className="flex items-center space-x-12">
              <div className="text-center w-24">
                <p className="text-xs text-slate-500 font-medium mb-1">平均完成度</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(item.average_completion_percent)}%</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center w-20">
                <p className="text-xs text-slate-500 font-medium mb-1">目標數量</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(item.goal_count)}</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>

              <Link to={`/goals/history/${item.cycle_id}`} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ml-4 group min-w-[80px] justify-end">
                查看詳情
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
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
