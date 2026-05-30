import { useEffect, useMemo, useState } from 'react';
import { Archive, FileText, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  listEvaluationTemplates,
  type EvaluationTemplateListItem,
} from '../api';
import { ApiRequestError } from '../../../../api/hr';

type StatusFilter = 'all' | 'published' | 'archived';

const statusLabels: Record<string, string> = {
  published: '已發布',
  archived: '已封存',
};

function formatDate(value: string) {
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

function getTemplateErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    return error.message;
  }

  return '無法載入考核模板。';
}

interface ReviewTemplatesContentProps {
  templates: EvaluationTemplateListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function ReviewTemplatesContent({
  templates,
  isLoading,
  errorMessage,
  onRetry,
}: ReviewTemplatesContentProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        載入考核模板中...
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

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        目前沒有符合條件的考核模板。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.template_id}
          className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 md:flex-row md:items-center"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              {template.status === 'archived' ? (
                <Archive className="h-6 w-6 text-slate-500" />
              ) : (
                <FileText className="h-6 w-6 text-indigo-600" />
              )}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800">{template.name}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    template.status === 'archived'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {statusLabels[template.status] ?? template.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>適用對象: {template.employee_group.name}</span>
                <span>考核週期: {template.cycle.name}</span>
                <span>問卷數: {template.assessment_template_count}</span>
                <span>最後更新: {formatDate(template.updated_at)}</span>
              </div>
            </div>
          </div>

          <Link
            to={`/hr/templates/${template.template_id}`}
            className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            查看詳情
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function ReviewTemplates() {
  const [templates, setTemplates] = useState<EvaluationTemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [reloadKey, setReloadKey] = useState(0);

  const query = useMemo(
    () => ({
      page: 1,
      page_size: 50,
      q: searchTerm.trim() || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [searchTerm, status],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadTemplates() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listEvaluationTemplates(query, { signal: controller.signal });
        setTemplates(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(getTemplateErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTemplates();

    return () => controller.abort();
  }, [query, reloadKey]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">考核模板列表</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理考核週期、員工群組與問卷配分。
          </p>
        </div>
        <Link
          to="/hr/templates/new"
          className="inline-flex items-center rounded bg-[#0B2544] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] focus:ring-2 focus:ring-[#0B2544] focus:ring-offset-2"
        >
          <span className="mr-2 text-lg font-bold leading-none">+</span>
          新增模板
        </Link>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <label className="relative block">
          <span className="sr-only">搜尋考核模板</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋模板名稱"
            className="w-full rounded border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label>
          <span className="sr-only">模板狀態</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">全部狀態</option>
            <option value="published">已發布</option>
            <option value="archived">已封存</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      <ReviewTemplatesContent
        templates={templates}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    </div>
  );
}
