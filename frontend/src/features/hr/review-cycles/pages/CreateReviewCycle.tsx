import { FormEvent, useState } from 'react';
import { Calendar, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../../../../api/hr';
import {
  createPerformanceCycle,
  type CycleType,
  type PerformanceCycleCreatePayload,
} from '../api';

interface CycleFormState {
  name: string;
  cycleType: CycleType;
  timezone: string;
  cycleStart: string;
  cycleEnd: string;
  managerEvalStart: string;
  managerEvalEnd: string;
  hrReviewEnd: string;
  appealDeadlineDays: string;
}

const initialFormState: CycleFormState = {
  name: '',
  cycleType: 'annual',
  timezone: 'Asia/Taipei',
  cycleStart: '',
  cycleEnd: '',
  managerEvalStart: '',
  managerEvalEnd: '',
  hrReviewEnd: '',
  appealDeadlineDays: '7',
};

const cycleTypeOptions: Array<{ value: CycleType; label: string }> = [
  { value: 'annual', label: '年度考核' },
  { value: 'quarterly', label: '季度考核' },
  { value: 'probation', label: '試用期考核' },
];

function toOffsetDateTime(date: string, boundary: 'start' | 'end') {
  const time = boundary === 'start' ? '00:00:00' : '23:59:59';
  return `${date}T${time}+08:00`;
}

function getCycleSubmitError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    return error.message;
  }

  return '無法建立考核週期。';
}

function buildPayload(form: CycleFormState): PerformanceCycleCreatePayload {
  const appealDeadlineDays = Number(form.appealDeadlineDays);
  const payload: PerformanceCycleCreatePayload = {
    name: form.name.trim(),
    cycle_type: form.cycleType,
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

function validateForm(form: CycleFormState) {
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

export default function CreateReviewCycle() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CycleFormState>(initialFormState);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof CycleFormState>(key: K, value: CycleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidationError(null);
    setSubmitError(null);
  }

  function handleRequestConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm(form);

    if (error) {
      setValidationError(error);
      return;
    }

    setShowConfirm(true);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const cycle = await createPerformanceCycle(buildPayload(form));
      navigate(`/hr/cycles/${cycle.id}`);
    } catch (error) {
      setSubmitError(getCycleSubmitError(error));
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-12">
      <div className="mb-6 flex items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">新增考核週期</h1>
          <p className="mt-1 text-sm text-slate-500">設定新的考核流程與各階段時間。</p>
        </div>
      </div>

      <form
        onSubmit={handleRequestConfirm}
        className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-8">
          <div className="space-y-6">
            {(validationError || submitError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {validationError ?? submitError}
              </div>
            )}

            <div>
              <label htmlFor="cycle-name" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                考核週期名稱
              </label>
              <input
                id="cycle-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0B2544] xl:py-2.5"
                placeholder="例如：2027 年度績效考核"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="cycle-type" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  週期類型
                </label>
                <select
                  id="cycle-type"
                  value={form.cycleType}
                  onChange={(event) => updateField('cycleType', event.target.value as CycleType)}
                  className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0B2544] xl:py-2.5"
                >
                  {cycleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  時區
                </label>
                <input
                  id="timezone"
                  type="text"
                  value={form.timezone}
                  onChange={(event) => updateField('timezone', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0B2544] xl:py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                考核期間
              </label>
              <div className="flex items-center gap-2">
                <DateInput
                  ariaLabel="考核起始日"
                  value={form.cycleStart}
                  onChange={(value) => updateField('cycleStart', value)}
                />
                <span className="text-sm font-medium text-slate-400">至</span>
                <DateInput
                  ariaLabel="考核結束日"
                  value={form.cycleEnd}
                  onChange={(value) => updateField('cycleEnd', value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                主管評核期間
              </label>
              <div className="flex items-center gap-2">
                <DateInput
                  ariaLabel="主管評核開始日"
                  value={form.managerEvalStart}
                  onChange={(value) => updateField('managerEvalStart', value)}
                />
                <span className="text-sm font-medium text-slate-400">至</span>
                <DateInput
                  ariaLabel="主管評核結束日"
                  value={form.managerEvalEnd}
                  onChange={(value) => updateField('managerEvalEnd', value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  HR 覆核截止日
                </label>
                <DateInput
                  ariaLabel="HR 覆核截止日"
                  value={form.hrReviewEnd}
                  onChange={(value) => updateField('hrReviewEnd', value)}
                />
              </div>

              <div>
                <label htmlFor="appeal-deadline" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  申覆期限天數
                </label>
                <input
                  id="appeal-deadline"
                  type="number"
                  min="1"
                  value={form.appealDeadlineDays}
                  onChange={(event) => updateField('appealDeadlineDays', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0B2544] xl:py-2.5"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                建立後週期狀態會由後端設定為尚未開始，後續可在詳情頁調整主管評核與 HR 覆核時間。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={() => navigate('/hr/cycles')}
            className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="rounded bg-[#0B2544] px-8 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#13335A]"
          >
            建立
          </button>
        </div>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-xl font-bold text-slate-800">確認建立</h2>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="p-1 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">確定要建立此考核週期嗎？</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="rounded bg-[#0B2544] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '建立中...' : '確定建立'}
              </button>
            </div>
          </div>
        </div>
      )}
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
        className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544] xl:py-2.5"
      />
    </div>
  );
}
