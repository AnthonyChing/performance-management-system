import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, Lock, RefreshCw } from 'lucide-react';
import { ApiRequestError } from '../../../../api/hr';
import {
  getPerformanceCycle,
  updatePerformanceCycle,
  updatePerformanceCycleStatus,
  type CycleStatus,
  type PerformanceCycle,
  type PerformanceCycleUpdatePayload,
} from '../api';

interface EditFormState {
  name: string;
  timezone: string;
  cycleStart: string;
  cycleEnd: string;
  managerEvalStart: string;
  managerEvalEnd: string;
  hrReviewEnd: string;
  appealDeadlineDays: string;
}

const statusLabels: Record<CycleStatus, string> = {
  draft: '草稿',
  not_started: '尚未開始',
  in_progress: '進行中',
  locked: '已鎖定',
  results_published: '結果已發布',
  completed: '已完成',
  closed: '已關閉',
};

const cycleTypeLabels: Record<string, string> = {
  annual: '年度考核',
  quarterly: '季度考核',
  probation: '試用期考核',
};

function toDateInput(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function toOffsetDateTime(date: string, boundary: 'start' | 'end') {
  const time = boundary === 'start' ? '00:00:00' : '23:59:59';
  return `${date}T${time}+08:00`;
}

function formatDateTime(value?: string | null) {
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateRange(start?: string, end?: string) {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

function getCycleErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    if (error.status === 404) {
      return '找不到此考核週期。';
    }
    return error.message;
  }

  return '無法載入考核週期。';
}

function createEditForm(cycle: PerformanceCycle): EditFormState {
  return {
    name: cycle.name,
    timezone: cycle.timezone ?? 'Asia/Taipei',
    cycleStart: toDateInput(cycle.cycle_start),
    cycleEnd: toDateInput(cycle.cycle_end),
    managerEvalStart: toDateInput(cycle.manager_eval_start),
    managerEvalEnd: toDateInput(cycle.manager_eval_end),
    hrReviewEnd: toDateInput(cycle.hr_review_end),
    appealDeadlineDays: String(cycle.appeal_deadline_days ?? 7),
  };
}

function validateEditForm(form: EditFormState) {
  if (!form.name.trim()) {
    return '請輸入考核週期名稱。';
  }
  if (!form.cycleStart || !form.cycleEnd) {
    return '請設定考核起始日與考核結束日。';
  }
  if (form.cycleStart > form.cycleEnd) {
    return '考核結束日不可早於起始日。';
  }
  if (!form.managerEvalStart || !form.managerEvalEnd || !form.hrReviewEnd) {
    return '請設定主管評核起訖日與 HR 覆核截止日。';
  }
  if (form.managerEvalStart > form.managerEvalEnd) {
    return '主管評核結束日不可早於開始日。';
  }
  if (Number(form.appealDeadlineDays) < 1) {
    return '申覆期限至少需為 1 天。';
  }

  return null;
}

function buildUpdatePayload(form: EditFormState): PerformanceCycleUpdatePayload {
  const appealDeadlineDays = Number(form.appealDeadlineDays);
  const payload: PerformanceCycleUpdatePayload = {
    name: form.name.trim(),
    timezone: form.timezone.trim() || 'Asia/Taipei',
    cycle_start: toOffsetDateTime(form.cycleStart, 'start'),
    cycle_end: toOffsetDateTime(form.cycleEnd, 'end'),
    manager_eval_start: toOffsetDateTime(form.managerEvalStart, 'start'),
    manager_eval_end: toOffsetDateTime(form.managerEvalEnd, 'end'),
    hr_review_end: toOffsetDateTime(form.hrReviewEnd, 'end'),
    appeal_deadline_days: Number.isFinite(appealDeadlineDays) ? appealDeadlineDays : 7,
  };

  return payload;
}

function getPrimaryNextStatus(status: CycleStatus): CycleStatus | null {
  if (status === 'not_started') return 'in_progress';
  if (status === 'in_progress') return 'locked';
  if (status === 'locked') return 'results_published';
  if (status === 'results_published') return 'completed';
  return null;
}

export default function ReviewCycleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<PerformanceCycle | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCycle() {
      if (!id) {
        setErrorMessage('缺少考核週期 ID。');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getPerformanceCycle(id, { signal: controller.signal });
        setCycle(response);
        setForm(createEditForm(response));
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

    void loadCycle();

    return () => controller.abort();
  }, [id, reloadKey]);

  function updateField<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setFormError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !form) {
      return;
    }

    const error = validateEditForm(form);
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const updated = await updatePerformanceCycle(id, buildUpdatePayload(form));
      setCycle(updated);
      setForm(createEditForm(updated));
      setIsEditing(false);
    } catch (error) {
      setFormError(getCycleErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusUpdate(nextStatus: CycleStatus) {
    if (!id) {
      return;
    }

    setIsUpdatingStatus(true);
    setFormError(null);

    try {
      const updated = await updatePerformanceCycleStatus(id, nextStatus);
      setCycle(updated);
      setForm(createEditForm(updated));
    } catch (error) {
      setFormError(getCycleErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        載入考核週期詳情中...
      </div>
    );
  }

  if (errorMessage || !cycle || !form) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <div className="font-semibold">{errorMessage ?? '無法載入考核週期。'}</div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="mt-3 inline-flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="h-4 w-4" />
          重新載入
        </button>
      </div>
    );
  }

  const nextStatus = getPrimaryNextStatus(cycle.status);

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/hr/cycles')}
          className="rounded-md border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{cycle.name}</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {statusLabels[cycle.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">考核週期詳細資訊與設定</p>
        </div>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold text-slate-800">週期設定</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatus && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusUpdate(nextStatus)}
                className="inline-flex items-center gap-2 rounded bg-[#0B2544] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#13335A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                轉為{statusLabels[nextStatus]}
              </button>
            )}
            {cycle.status !== 'closed' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusUpdate('closed')}
                className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                關閉週期
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsEditing((value) => !value);
                setForm(createEditForm(cycle));
                setFormError(null);
              }}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {isEditing ? '取消編輯' : '編輯設定'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">考核週期名稱</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]"
                />
              </label>
              <label>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">時區</span>
                <input
                  value={form.timezone}
                  onChange={(event) => updateField('timezone', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]"
                />
              </label>
            </div>

            <DateRangeFields
              label="考核期間"
              startLabel="考核起始日"
              endLabel="考核結束日"
              startValue={form.cycleStart}
              endValue={form.cycleEnd}
              onStartChange={(value) => updateField('cycleStart', value)}
              onEndChange={(value) => updateField('cycleEnd', value)}
            />

            <DateRangeFields
              label="主管評核期間"
              startLabel="主管評核開始日"
              endLabel="主管評核結束日"
              startValue={form.managerEvalStart}
              endValue={form.managerEvalEnd}
              onStartChange={(value) => updateField('managerEvalStart', value)}
              onEndChange={(value) => updateField('managerEvalEnd', value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">HR 覆核截止日</span>
                <DateInput
                  ariaLabel="HR 覆核截止日"
                  value={form.hrReviewEnd}
                  onChange={(value) => updateField('hrReviewEnd', value)}
                />
              </label>
              <label>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">申覆期限天數</span>
                <input
                  type="number"
                  min="1"
                  value={form.appealDeadlineDays}
                  onChange={(event) => updateField('appealDeadlineDays', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setForm(createEditForm(cycle));
                  setFormError(null);
                }}
                className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded bg-[#0B2544] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              <InfoItem icon={FileText} label="週期類型" value={cycleTypeLabels[cycle.cycle_type ?? ''] ?? cycle.cycle_type ?? '未設定'} />
              <InfoItem icon={Clock} label="時區" value={cycle.timezone ?? '未設定'} />
              <InfoItem icon={Calendar} label="考核期間" value={formatDateRange(cycle.cycle_start, cycle.cycle_end)} />
              <InfoItem icon={Calendar} label="主管評核期間" value={formatDateRange(cycle.manager_eval_start, cycle.manager_eval_end)} />
              <InfoItem icon={Calendar} label="HR 覆核截止" value={formatDateTime(cycle.hr_review_end)} />
              <InfoItem icon={Clock} label="申覆期限" value={`${cycle.appeal_deadline_days ?? 7} 天`} />
              <InfoItem icon={Lock} label="鎖定狀態" value={cycle.is_locked ? '已鎖定' : '未鎖定'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: typeof Calendar;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="flex items-center text-sm font-medium text-slate-800">
        <Icon className="mr-2 h-4 w-4 text-slate-400" />
        {value}
      </div>
    </div>
  );
}

interface DateRangeFieldsProps {
  label: string;
  startLabel: string;
  endLabel: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

function DateRangeFields({
  label,
  startLabel,
  endLabel,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: DateRangeFieldsProps) {
  return (
    <div>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <DateInput ariaLabel={startLabel} value={startValue} onChange={onStartChange} />
        <span className="text-sm font-medium text-slate-400">至</span>
        <DateInput ariaLabel={endLabel} value={endValue} onChange={onEndChange} />
      </div>
    </div>
  );
}

interface DateInputProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}

function DateInput({ ariaLabel, value, onChange }: DateInputProps) {
  return (
    <div className="relative flex-1">
      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        aria-label={ariaLabel}
        type="date"
        min="1000-01-01"
        max="9999-12-31"
        value={value}
        onChange={(event) => {
          const v = event.target.value;
          if (!v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && parseInt(v.slice(5, 7), 10) <= 12 && parseInt(v.slice(8, 10), 10) <= 31)) {
            onChange(v);
          }
        }}
        className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]"
      />
    </div>
  );
}
