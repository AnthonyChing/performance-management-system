import { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiRequestError } from '../../../../api/hr';
import {
  listPerformanceCycles,
  type CycleStatus,
  type PerformanceCycle,
} from '../api';

type StatusFilter = 'all' | CycleStatus;

const statusLabels: Record<CycleStatus, string> = {
  draft: '草稿',
  not_started: '尚未開始',
  in_progress: '進行中',
  locked: '已鎖定',
  results_published: '結果已發布',
  completed: '已完成',
  closed: '已關閉',
};

const statusClasses: Record<CycleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  not_started: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  locked: 'bg-amber-100 text-amber-700',
  results_published: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-violet-100 text-violet-700',
  closed: 'bg-zinc-100 text-zinc-700',
};

const cycleTypeLabels: Record<string, string> = {
  annual: '年度考核',
  quarterly: '季度考核',
  probation: '試用期考核',
};

function formatDate(value?: string) {
  if (!value) {
    return '未設定';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateRange(start?: string, end?: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getCycleErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    return error.message;
  }

  return '無法載入考核週期。';
}

interface ReviewCyclesContentProps {
  cycles: PerformanceCycle[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function ReviewCyclesContent({
  cycles,
  isLoading,
  errorMessage,
  onRetry,
}: ReviewCyclesContentProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        載入考核週期中...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <div className="font-semibold">{errorMessage}</div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="h-4 w-4" />
          重新載入
        </button>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        目前沒有符合條件的考核週期。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cycles.map((cycle) => (
        <div
          key={cycle.id}
          className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 md:flex-row md:items-center"
        >
          <div className="mb-1 md:mb-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800">{cycle.name}</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusClasses[cycle.status]
                }`}
              >
                {statusLabels[cycle.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <div className="flex items-center">
                <Settings className="mr-1.5 h-4 w-4 text-slate-400" />
                {cycleTypeLabels[cycle.cycle_type ?? ''] ?? cycle.cycle_type ?? '未設定類型'}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                主管評核: {formatDateRange(cycle.manager_eval_start, cycle.manager_eval_end)}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                HR 覆核截止: {formatDate(cycle.hr_review_end)}
              </div>
            </div>
          </div>

          <Link
            to={`/hr/cycles/${cycle.id}`}
            className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            查看詳情
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function ReviewCycles() {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const query = useMemo(
    () => ({
      page,
      page_size: 10,
      status: status === 'all' ? undefined : status,
    }),
    [page, status],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCycles() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listPerformanceCycles(query, { signal: controller.signal });
        setCycles(response.data);
        setTotalPages(Math.max(response.meta.total_pages, 1));
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(getCycleErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCycles();

    return () => controller.abort();
  }, [query, reloadKey]);

  function handleStatusChange(nextStatus: StatusFilter) {
    setStatus(nextStatus);
    setPage(1);
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">考核週期列表</h1>
          <p className="mt-1 text-sm text-slate-500">管理與追蹤所有組織內的績效考核流程</p>
        </div>
        <Link
          to="/hr/cycles/new"
          className="inline-flex items-center gap-2 rounded bg-[#0B2544] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] focus:ring-2 focus:ring-[#0B2544] focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          新增考核週期
        </Link>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[220px_auto]">
        <label>
          <span className="sr-only">週期狀態</span>
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">全部狀態</option>
            <option value="not_started">尚未開始</option>
            <option value="in_progress">進行中</option>
            <option value="locked">已鎖定</option>
            <option value="results_published">結果已發布</option>
            <option value="completed">已完成</option>
            <option value="closed">已關閉</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:justify-self-end"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      <ReviewCyclesContent
        cycles={cycles}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((value) => value + 1)}
      />

      {!isLoading && !errorMessage && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              className="flex h-8 min-w-8 items-center justify-center rounded border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              上一頁
            </button>
            <span className="px-2 text-sm font-medium text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
              className="flex h-8 min-w-8 items-center justify-center rounded border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
