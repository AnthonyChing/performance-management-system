import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, ClipboardList, Info, Loader2, RefreshCw, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  getEvaluationTemplate,
  updateEvaluationTemplate,
  type EvaluationTemplate,
} from '../api';
import { ApiRequestError } from '../../../../api/hr';

const statusLabels: Record<string, string> = {
  published: '已發布',
  archived: '已封存',
};

function getDetailErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    if (error.status === 404) {
      return '找不到此考核模板。';
    }
    return error.message;
  }

  return '無法載入考核模板。';
}

function formatDateTime(value?: string) {
  if (!value) {
    return '未提供';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export interface ReviewTemplateDetailContentProps {
  template: EvaluationTemplate;
  isArchiving: boolean;
  onArchive: () => void;
}

export function ReviewTemplateDetailContent({
  template,
  isArchiving,
  onArchive,
}: ReviewTemplateDetailContentProps) {
  const canArchive = template.available_actions.can_archive && template.status !== 'archived';

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{template.name}</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              template.status === 'archived'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {statusLabels[template.status] ?? template.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/hr/templates"
            className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
          <button
            type="button"
            onClick={onArchive}
            disabled={!canArchive || isArchiving}
            className="inline-flex items-center rounded bg-[#0B2544] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isArchiving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            封存模板
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <Info className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">基本資訊</h2>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-1 text-sm font-semibold text-slate-500">模板說明</div>
              <p className="text-sm leading-relaxed text-slate-700">
                {template.description || '未提供模板說明。'}
              </p>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-500">考核週期</div>
              <div className="text-sm font-medium text-slate-700">{template.cycle.name}</div>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-500">最後更新</div>
              <div className="text-sm font-medium text-slate-700">{formatDateTime(template.updated_at)}</div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <Users className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">員工群組</h2>
          </div>
          <div className="p-6">
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex w-40 shrink-0 flex-col items-center justify-center border-r border-slate-200 bg-indigo-50 px-6 py-4">
                <Users className="mb-2 h-6 w-6 text-indigo-600" />
                <div className="mb-0.5 text-xs text-indigo-600/80">目標對象</div>
                <div className="text-sm font-bold text-indigo-900">{template.employee_group.name}</div>
              </div>
              <div className="flex items-center p-6 text-sm text-slate-700">
                {template.employee_group.description || template.employee_group.group_id}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">選用問卷</h2>
          </div>
          <div className="space-y-3 p-6">
            {template.assessment_templates.map((assessmentTemplate) => (
              <div
                key={assessmentTemplate.assessment_template_id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
                    <ClipboardList className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">{assessmentTemplate.name}</span>
                    <div className="mt-0.5 text-xs text-slate-500">
                      題目數: {assessmentTemplate.question_count}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">配分比例</span>
                  <span className="font-bold text-[#0B2544]">{assessmentTemplate.weight_percent}%</span>
                </div>
              </div>
            ))}
            <div className="mt-2 flex justify-end border-t border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600">總計</span>
                <span className="text-lg font-black text-emerald-600">
                  {template.total_weight_percent}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ReviewTemplateDetail() {
  const { id } = useParams();
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTemplate() {
      if (!id) {
        setErrorMessage('缺少考核模板 ID。');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getEvaluationTemplate(id, { signal: controller.signal });
        setTemplate(response);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(getDetailErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTemplate();

    return () => controller.abort();
  }, [id, reloadKey]);

  async function handleArchive() {
    if (!id) {
      return;
    }

    setIsArchiving(true);
    setErrorMessage(null);

    try {
      const response = await updateEvaluationTemplate(id, { status: 'archived' });
      setTemplate(response);
    } catch (error) {
      setErrorMessage(getDetailErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        載入考核模板中...
      </div>
    );
  }

  if (errorMessage || !template) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <div className="font-semibold">{errorMessage ?? '無法顯示考核模板。'}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="inline-flex items-center rounded border border-red-200 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重新載入
          </button>
          <Link
            to="/hr/templates"
            className="inline-flex items-center rounded border border-red-200 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReviewTemplateDetailContent
      template={template}
      isArchiving={isArchiving}
      onArchive={() => void handleArchive()}
    />
  );
}
