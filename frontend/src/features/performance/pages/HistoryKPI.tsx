import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ApiRequestError,
  getMyHistoricalKpiResults,
  type EmployeePagination,
  type KpiResultSummary,
} from '../api';
import { formatRatingScale, getRatingScaleClass } from '../ratingScale';

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

  return '歷史 KPI 載入失敗。';
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (start && end) return `${start} 至 ${end}`;
  return start ?? end ?? '-';
}

export default function HistoryKPI() {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState<KpiResultSummary[]>([]);
  const [pagination, setPagination] = useState<EmployeePagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadHistoricalKpis() {
      setIsLoading(true);

      try {
        const response = await getMyHistoricalKpiResults(
          { page, page_size: PAGE_SIZE },
          { signal: controller.signal },
        );

        if (!isMounted) return;
        setResults(response.results ?? []);
        setPagination(response.pagination ?? null);
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

    loadHistoricalKpis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, page]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">歷史 KPI 列表</h1>
        <p className="text-slate-500 text-sm mt-1">查閱過去所有考核週期的績效數據與最終評分</p>
      </div>

      <HistoryKpiContent
        isLoading={isLoading}
        errorMessage={errorMessage}
        results={results}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}

export function HistoryKpiContent({
  isLoading,
  errorMessage,
  results,
  pagination,
  onPageChange,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  results: KpiResultSummary[];
  pagination: EmployeePagination | null;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return <div className="text-sm text-slate-500">載入歷史 KPI 中...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        目前尚無歷史 KPI 資料。
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mb-8">
        {results.map((item, index) => {
          const cycle = item.cycle;
          const cycleId = cycle?.cycle_id;

          return (
            <div
              key={item.result_id ?? cycleId ?? index}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1 mb-4 md:mb-0">
                <h3 className="text-lg font-bold text-slate-800">
                  {cycle?.name ?? '未命名考核週期'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  考核區間：{formatDateRange(cycle?.start_date, cycle?.end_date)}
                </p>
                {cycle?.period_label && (
                  <p className="text-xs text-slate-400 mt-1">{cycle.period_label}</p>
                )}
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">最終等級</p>
                  <span
                    className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-lg font-bold ${getRatingScaleClass(item.final_grade)}`}
                  >
                    {formatRatingScale(item.final_grade)}
                  </span>
                </div>

                {cycleId ? (
                  <Link
                    to={`/performance/history/${cycleId}`}
                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ml-4 group"
                  >
                    查看詳情
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="flex items-center text-sm font-medium text-slate-400 ml-4">
                    查看詳情
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
