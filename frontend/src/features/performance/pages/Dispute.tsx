import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, CheckCircle2, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ApiRequestError,
  getMyAppeals,
  submitMyAppeal,
  type Appeal,
  type AppealsResponse,
} from '../api';

type DisputeView = 'submit' | 'list';

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

function isNoCurrentAppealDataError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    (
      error.code === 'CURRENT_APPEAL_PERIOD_NOT_FOUND' ||
      error.code === 'REVIEW_NOT_FOUND' ||
      error.code === 'CYCLE_NOT_FOUND'
    )
  );
}

function getApiErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 && error.code === 'UNAUTHORIZED') {
      return t('unauthorized');
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return t('loadFailed');
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

export default function Dispute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('dispute');
  const requestedView = useMemo(() => getRequestedView(location.state), [location.state]);
  const [view, setView] = useState<DisputeView>(requestedView);
  const [appealsData, setAppealsData] = useState<AppealsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
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
        setEmptyMessage(null);
        setView(response.current_appeal ? 'list' : requestedView);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          const redirectPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
          return;
        }

        if (isNoCurrentAppealDataError(error)) {
          setAppealsData(null);
          setLoadErrorMessage(null);
          setEmptyMessage(t('noData'));
          setView('list');
          return;
        }

        setLoadErrorMessage(getApiErrorMessage(error, t));
        setEmptyMessage(null);
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
  }, [location.pathname, location.search, navigate, requestedView, t]);

  const currentAppeal = appealsData?.current_appeal ?? null;
  const actions = appealsData?.available_actions;
  const canStartAppeal = Boolean(actions?.can_start_appeal);
  const canSubmit = Boolean(actions?.can_submit && appealsData?.period.cycle_id);
  const unavailableReason = actions?.start_appeal_unavailable_reason ?? actions?.submit_unavailable_reason;
  const unavailableMessage = unavailableReason
    ? (t(`unavailableReason.${unavailableReason}`, unavailableReason))
    : null;

  function openSubmitView() {
    setSubmitErrorMessage(null);
    setView('submit');
  }

  function openConfirmationModal() {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setSubmitErrorMessage(t('submitView.errors.emptyReason'));
      return;
    }

    if (trimmedReason.length > 2000) {
      setSubmitErrorMessage(t('submitView.errors.tooLong'));
      return;
    }

    if (!canSubmit || !appealsData?.period.cycle_id) {
      setSubmitErrorMessage(unavailableMessage ?? t('submitView.errors.unavailable'));
      return;
    }

    setSubmitErrorMessage(null);
    setIsModalOpen(true);
  }

  async function handleSubmitAppeal() {
    if (!appealsData?.period.cycle_id) {
      setSubmitErrorMessage(t('submitView.errors.noCycle'));
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

      setSubmitErrorMessage(getApiErrorMessage(error, t));
      if (isNoCurrentAppealDataError(error)) {
        setSubmitErrorMessage(t('submitView.errors.noData'));
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {t('title')}
        </h1>
        {view === 'list' && !currentAppeal && (
          <button
            onClick={openSubmitView}
            disabled={!canStartAppeal}
            className="text-sm px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('initiate')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {t('loading')}
        </div>
      ) : emptyMessage && !appealsData ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : loadErrorMessage || !appealsData ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadErrorMessage ?? t('loadFailed')}
        </div>
      ) : view === 'submit' && !currentAppeal ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <div className="text-sm text-slate-500">{t('submitView.period')}</div>
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
                {t('submitView.reasonLabel')}
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
                <span>{t('submitView.charCount', { count: reason.length })}</span>
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
                {t('submitView.back')}
              </button>
              <button
                onClick={openConfirmationModal}
                disabled={!canSubmit || isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('submitView.submit')}
              </button>
            </div>
          </div>
        </div>
      ) : currentAppeal ? (
        <AppealResultPanel appeal={currentAppeal} appealsData={appealsData} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
          <p>{t('listView.noPending')}</p>
          {unavailableMessage && (
            <p className="mt-2">{unavailableMessage}</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                {t('modal.title')}
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
                {t('modal.body')}
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                <span className="font-bold mr-1">{t('modal.warningLabel')}</span>
                {t('modal.warning')}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                {t('modal.cancel')}
              </button>
              <button
                onClick={handleSubmitAppeal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? t('modal.submitting') : t('modal.submit')}
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
  const { t } = useTranslation('dispute');
  const statusLabel = t(`status.${appeal.status}`, appeal.status);
  const isFinal = appeal.is_final_response || appeal.status === 'approved' || appeal.status === 'rejected';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="mb-8">
        <div className="flex items-center font-bold text-slate-800 text-lg mb-4 border-b border-slate-200 pb-2">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          {t('appealResult.disputeContentTitle')}
        </div>
        <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
          <div>
            <span className="text-slate-400 block mb-1">{t('appealResult.period')}</span>
            <span className="font-medium text-slate-800">{formatPeriod(appeal, appealsData)}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{t('appealResult.caseStatus')}</span>
            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {statusLabel}
            </span>
          </div>
        </div>
        <div>
          <span className="text-slate-400 block mb-2 text-sm">{t('appealResult.reasonLabel')}</span>
          <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 border border-slate-200 leading-relaxed">
            {appeal.reason}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center font-bold text-slate-800 text-lg mb-4">
          <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
          {t('appealResult.resultSectionTitle')}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="font-medium py-3 px-4">{t('appealResult.table.caseNo')}</th>
                <th className="font-medium py-3 px-4">{t('appealResult.table.submittedAt')}</th>
                <th className="font-medium py-3 px-4">{t('appealResult.table.handler')}</th>
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
              {t('appealResult.processingComments')}
            </h4>
            {isFinal && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {t('appealResult.finalResponse')}
              </span>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {appeal.processing_comment ?? t('appealResult.noComment')}
          </p>
          {appeal.processing_comment_updated_at && (
            <div className="mt-3 text-xs text-slate-400">
              {t('appealResult.updatedAt', { date: formatDateTime(appeal.processing_comment_updated_at) })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
