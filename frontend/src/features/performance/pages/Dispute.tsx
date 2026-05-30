import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, CheckCircle2, FileText, X } from 'lucide-react';
import {
  ApiRequestError,
  getMyAppeals,
  submitMyAppeal,
  type Appeal,
  type AppealsResponse,
} from '../api';

type DisputeView = 'submit' | 'list';

const appealStatusLabels: Record<string, string> = {
  submitted: '已提交',
  under_review: '審核中',
  need_more_info: '需補充資料',
  approved: '異議通過',
  rejected: '異議未通過',
  cancelled: '已取消',
};

const unavailableReasonLabels: Record<string, string> = {
  already_submitted: '本期已提交績效異議。',
  not_open: '目前尚未開放異議。',
  closed: '異議期間已結束。',
  result_not_published: '考核結果尚未公佈。',
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

  return '績效異議資料載入失敗。';
}

function getRequestedView(locationState: unknown): DisputeView {
  if (
    locationState &&
    typeof locationState === 'object' &&
    'view' in locationState &&
    locationState.view === 'submit'
  ) {
    return 'submit';
  }

  return 'list';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 16);
}

function formatPeriod(appeal: Appeal | null | undefined, data: AppealsResponse | null) {
  const period = appeal?.period ?? data?.period;

  if (!period) {
    return '-';
  }

  if (period.period_label) {
    return `${period.name} (${period.period_label})`;
  }

  if (period.start_date && period.end_date) {
    return `${period.name} (${period.start_date}~${period.end_date})`;
  }

  return period.name;
}

function formatHandler(appeal: Appeal | null | undefined) {
  const handler = appeal?.handler;

  if (!handler) {
    return '-';
  }

  const englishName = handler.english_name ? ` (${handler.english_name})` : '';
  const department = handler.department ? `${handler.department} - ` : '';

  return `${department}${handler.name}${englishName}`;
}

function getUnavailableMessage(reason: string | null | undefined) {
  if (!reason) {
    return null;
  }

  return unavailableReasonLabels[reason] ?? reason;
}

export default function Dispute() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedView = useMemo(() => getRequestedView(location.state), [location.state]);
  const [view, setView] = useState<DisputeView>(requestedView);
  const [appealsData, setAppealsData] = useState<AppealsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadAppeals() {
      try {
        const response = await getMyAppeals({ signal: controller.signal });

        if (!isMounted) return;

        setAppealsData(response);
        setLoadErrorMessage(null);
        setView(response.current_appeal ? 'list' : requestedView);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          const redirectPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
          return;
        }

        setLoadErrorMessage(getApiErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAppeals();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, requestedView]);

  const currentAppeal = appealsData?.current_appeal ?? null;
  const actions = appealsData?.available_actions;
  const canStartAppeal = Boolean(actions?.can_start_appeal);
  const canSubmit = Boolean(actions?.can_submit && appealsData?.period.cycle_id);
  const unavailableMessage = getUnavailableMessage(
    actions?.start_appeal_unavailable_reason ?? actions?.submit_unavailable_reason,
  );

  function openSubmitView() {
    setSubmitErrorMessage(null);
    setView('submit');
  }

  function openConfirmationModal() {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setSubmitErrorMessage('請填寫異議說明內容。');
      return;
    }

    if (trimmedReason.length > 2000) {
      setSubmitErrorMessage('異議說明內容不可超過 2000 字。');
      return;
    }

    if (!canSubmit || !appealsData?.period.cycle_id) {
      setSubmitErrorMessage(unavailableMessage ?? '目前無法提交績效異議。');
      return;
    }

    setSubmitErrorMessage(null);
    setIsModalOpen(true);
  }

  async function handleSubmitAppeal() {
    if (!appealsData?.period.cycle_id) {
      setSubmitErrorMessage('目前沒有可提出異議的考核週期。');
      setIsModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitErrorMessage(null);
      const response = await submitMyAppeal({
        period_id: appealsData.period.cycle_id,
        reason: reason.trim(),
      });

      setAppealsData((current) => ({
        mode: 'result',
        period: response.appeal.period ?? current?.period ?? appealsData.period,
        appeal_period: current?.appeal_period ?? appealsData.appeal_period,
        review_result: current?.review_result ?? appealsData.review_result,
        current_appeal: response.appeal,
        available_actions: response.available_actions ?? current?.available_actions ?? null,
      }));
      setReason('');
      setIsModalOpen(false);
      setView('list');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }

      setSubmitErrorMessage(getApiErrorMessage(error));
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          績效異議處理 (Performance Dispute Handling)
        </h1>
        {view === 'list' && !currentAppeal && (
          <button
            onClick={openSubmitView}
            disabled={!canStartAppeal}
            className="text-sm px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            發起異議
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          載入績效異議資料中...
        </div>
      ) : loadErrorMessage || !appealsData ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadErrorMessage ?? '績效異議資料載入失敗。'}
        </div>
      ) : view === 'submit' && !currentAppeal ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <div className="text-sm text-slate-500">申訴績效期間</div>
            <div className="mt-1 font-semibold text-slate-800">
              {formatPeriod(null, appealsData)}
            </div>
            {appealsData.review_result?.manager_comment && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {appealsData.review_result.manager_comment}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                異議說明內容
              </label>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setSubmitErrorMessage(null);
                }}
                maxLength={2000}
                className="w-full h-48 p-4 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm resize-none bg-slate-50/50"
              />
              <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                <span>{unavailableMessage}</span>
                <span>{reason.length}/2000</span>
              </div>
            </div>

            {submitErrorMessage && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {submitErrorMessage}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setView('list')}
                className="px-6 py-2.5 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                返回
              </button>
              <button
                onClick={openConfirmationModal}
                disabled={!canSubmit || isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                提交異議申請
              </button>
            </div>
          </div>
        </div>
      ) : currentAppeal ? (
        <AppealResultPanel appeal={currentAppeal} appealsData={appealsData} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-slate-500" />
            <div>
              <div className="font-semibold text-slate-800">目前尚未提出本期績效異議。</div>
              <div className="mt-2 text-sm text-slate-500">
                {unavailableMessage ?? `申訴績效期間：${formatPeriod(null, appealsData)}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                確認提交異議申請
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                確定要提交績效異議申請嗎？
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                <span className="font-bold mr-1">注意：</span>
                申請提交後將進入人資審核流程，期間無法修改異議內容。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSubmitAppeal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '確認提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppealResultPanel({
  appeal,
  appealsData,
}: {
  appeal: Appeal;
  appealsData: AppealsResponse;
}) {
  const statusLabel = appealStatusLabels[appeal.status] ?? appeal.status;
  const isFinal = appeal.is_final_response || appeal.status === 'approved' || appeal.status === 'rejected';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="mb-8">
        <div className="flex items-center font-bold text-slate-800 text-lg mb-4 border-b border-slate-200 pb-2">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          異議內容 (Dispute Content)
        </div>
        <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
          <div>
            <span className="text-slate-400 block mb-1">申訴績效期間</span>
            <span className="font-medium text-slate-800">{formatPeriod(appeal, appealsData)}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">案件狀態</span>
            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {statusLabel}
            </span>
          </div>
        </div>
        <div>
          <span className="text-slate-400 block mb-2 text-sm">異議說明</span>
          <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 border border-slate-200 leading-relaxed">
            {appeal.reason}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center font-bold text-slate-800 text-lg mb-4">
          <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
          區塊 B：異議結果
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="font-medium py-3 px-4">異議編號</th>
                <th className="font-medium py-3 px-4">提交日期</th>
                <th className="font-medium py-3 px-4">處理人</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 font-medium">
              <tr>
                <td className="py-4 px-4 border-r border-slate-100">
                  {appeal.case_no ?? appeal.appeal_id}
                </td>
                <td className="py-4 px-4 border-r border-slate-100">
                  {formatDateTime(appeal.submitted_at)}
                </td>
                <td className="py-4 px-4">{formatHandler(appeal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/50 p-5 rounded-lg border-l-4 border-indigo-600 text-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              處理意見與備註 (Processing Comments)
            </h4>
            {isFinal && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                最終回覆
              </span>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {appeal.processing_comment ?? '目前尚無處理意見。'}
          </p>
          {appeal.processing_comment_updated_at && (
            <div className="mt-3 text-xs text-slate-400">
              更新時間：{formatDateTime(appeal.processing_comment_updated_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
