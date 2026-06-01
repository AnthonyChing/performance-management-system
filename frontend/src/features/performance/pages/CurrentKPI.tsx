import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ApiRequestError,
  confirmMyKpiResult,
  getMyKpiResult,
  getMyKpiStandards,
  type KpiResultSummary,
  type KpiStandard,
  type KpiStandardsResponse,
} from '../api';

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

function isNoCurrentKpiDataError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    (
      error.code === 'CURRENT_KPI_CYCLE_NOT_FOUND' ||
      error.code === 'KPI_REVIEW_NOT_FOUND' ||
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

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return '-';
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function formatActualTarget(value: number | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) {
    return '-';
  }

  return `${value}${unit ? ` ${unit}` : ''}`;
}

export default function CurrentKPI() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('performance');
  const [activeTab, setActiveTab] = useState<'standards' | 'results'>('standards');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [standardsData, setStandardsData] = useState<KpiStandardsResponse | null>(null);
  const [isStandardsLoading, setIsStandardsLoading] = useState(true);
  const [standardsErrorMessage, setStandardsErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<KpiResultSummary | null>(null);
  const [isResultLoading, setIsResultLoading] = useState(true);
  const [resultErrorMessage, setResultErrorMessage] = useState<string | null>(null);
  const [confirmErrorMessage, setConfirmErrorMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    function redirectToLogin() {
      const redirectPath = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }

    async function loadStandards() {
      try {
        const response = await getMyKpiStandards({ signal: controller.signal });

        if (!isMounted) return;
        setStandardsData(response);
        setStandardsErrorMessage(null);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        if (isNoCurrentKpiDataError(error)) {
          setStandardsData(null);
          setStandardsErrorMessage(null);
          return;
        }

        setStandardsErrorMessage(getApiErrorMessage(error, t));
      } finally {
        if (isMounted) {
          setIsStandardsLoading(false);
        }
      }
    }

    async function loadResult() {
      try {
        const response = await getMyKpiResult({ signal: controller.signal });

        if (!isMounted) return;
        setResultData(response.result);
        setResultErrorMessage(null);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        if (isNoCurrentKpiDataError(error)) {
          setResultData(null);
          setResultErrorMessage(null);
          return;
        }

        setResultErrorMessage(getApiErrorMessage(error, t));
      } finally {
        if (isMounted) {
          setIsResultLoading(false);
        }
      }
    }

    loadStandards();
    loadResult();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, t]);

  const pageTitle = standardsData?.cycle.name ?? t('defaultTitle');

  async function handleConfirmResult() {
    if (!resultData?.result_id) {
      setConfirmErrorMessage(t('results.noConfirmable'));
      return;
    }

    try {
      setIsConfirming(true);
      setConfirmErrorMessage(null);
      const response = await confirmMyKpiResult(resultData.result_id);
      setResultData((current) => ({
        ...(current ?? {}),
        ...response.result,
        confirmation: response.confirmation,
      }));
      setIsConfirmModalOpen(false);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }

      setConfirmErrorMessage(getApiErrorMessage(error, t));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
        {standardsData?.cycle.period_label && (
          <p className="mt-2 text-sm text-slate-500">{standardsData.cycle.period_label}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'standards' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('standards')}
        >
          {t('tabs.standards')}
          {activeTab === 'standards' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-lg"></div>
          )}
        </button>
        <button
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'results' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('results')}
        >
          {t('tabs.results')}
          {activeTab === 'results' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-lg"></div>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'standards' && (
        <CurrentKpiStandardsContent
          isLoading={isStandardsLoading}
          errorMessage={standardsErrorMessage}
          standards={standardsData?.standards ?? []}
        />
      )}

      {activeTab === 'results' && (
        <CurrentKpiResultsContent
          isLoading={isResultLoading}
          errorMessage={resultErrorMessage}
          result={resultData}
          onConfirm={() => {
            setConfirmErrorMessage(null);
            setIsConfirmModalOpen(true);
          }}
          onDispute={() => navigate('/dispute', { state: { view: 'submit' } })}
        />
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                {t('confirmModal.title')}
              </h2>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t('confirmModal.body')}
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                <span className="font-bold mr-1">{t('confirmModal.warningLabel')}</span>
                {t('confirmModal.warning')}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                {t('confirmModal.cancel')}
              </button>
              {confirmErrorMessage && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {confirmErrorMessage}
                </div>
              )}
              <button
                onClick={handleConfirmResult}
                disabled={isConfirming}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm"
              >
                {isConfirming ? t('confirmModal.submitting') : t('confirmModal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CurrentKpiResultsContent({
  isLoading,
  errorMessage,
  result,
  onConfirm,
  onDispute,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  result: KpiResultSummary | null;
  onConfirm: () => void;
  onDispute: () => void;
}) {
  const { t } = useTranslation('performance');

  if (isLoading) {
    return <div className="text-sm text-slate-500">{t('results.loading')}</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        {t('results.empty')}
      </div>
    );
  }

  const scoreSummary = result.score_summary;
  const kpiResults = result.kpi_results ?? [];
  const actions = result.available_actions;
  const canConfirm = Boolean(actions?.can_confirm && result.result_id);
  const canDispute = Boolean(actions?.can_dispute);
  const disputePeriod = result.dispute_period;

  if (result.status === 'not_published') {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        {t('results.notPublished')}
      </div>
    );
  }

  const statusInfoText = result.confirmation
    ? t('results.statusInfo.confirmed', { date: result.confirmation.confirmed_at ?? '-' })
    : disputePeriod?.start_date && disputePeriod?.end_date
      ? t('results.statusInfo.disputeWindow', { start: disputePeriod.start_date, end: disputePeriod.end_date })
      : t('results.statusInfo.default');

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ResultSummaryCard
          label={t('results.summary.performanceScore')}
          value={formatValue(scoreSummary?.performance_score ?? result.performance_score)}
          subLabel={t('results.summary.performanceGrade')}
          subValue={result.final_grade ?? '-'}
          accent
        />
        <ResultSummaryCard
          label={t('results.summary.kpiAchievement')}
          value={formatValue(scoreSummary?.kpi_achievement_percent, '%')}
          subLabel={t('results.summary.weightedScore')}
          subValue={formatValue(result.weighted_score)}
        />
        <ResultSummaryCard
          label={t('results.summary.managerReview')}
          value={formatValue(scoreSummary?.manager_review_score ?? result.review_score)}
          subLabel={t('results.summary.managerComment')}
          subValue={result.manager_evaluation?.comment ?? '-'}
        />
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-2">
          {t('results.kpiBreakdown')}
        </h3>

        {kpiResults.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {t('results.kpiNotCalculated')}
          </div>
        ) : (
          <div className="space-y-6">
            {kpiResults.map((item) => {
              const achievement = item.achievement_percent ?? 0;
              const progressWidth = `${Math.min(Math.max(achievement, 0), 100)}%`;
              const actualText = item.actual?.display_text ??
                formatActualTarget(item.actual?.value, item.actual?.unit);
              const targetText = item.target?.display_text ??
                formatActualTarget(item.target?.value, item.target?.unit);

              return (
                <div key={item.kpi_id}>
                  <div className="flex justify-between text-sm mb-2 gap-4">
                    <div>
                      <span className="font-bold text-slate-800 mr-2">{item.name}</span>
                      <span className="text-xs text-slate-500">
                        {t('results.actualTarget', { actual: actualText, target: targetText })}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        achievement > 100 ? 'text-orange-500' : 'text-slate-800'
                      }`}
                    >
                      {formatValue(item.achievement_percent, '%')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        achievement > 100 ? 'bg-orange-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: progressWidth }}
                    ></div>
                  </div>
                  {item.latest_snapshot?.note && (
                    <p className="mt-2 text-xs text-slate-500">{item.latest_snapshot.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center text-sm text-slate-600 mb-4 md:mb-0">
          <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-xs mr-3 flex-shrink-0">i</div>
          {statusInfoText}
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <button
            onClick={onDispute}
            disabled={!canDispute}
            className="flex-1 md:flex-none px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('results.actions.dispute')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('results.actions.confirm')}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

function ResultSummaryCard({
  label,
  value,
  subLabel,
  subValue,
  accent = false,
}: {
  label: string;
  value: string;
  subLabel: string;
  subValue: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</h4>
        <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">{subLabel}</span>
        <span
          className={`text-sm font-bold text-right ${
            accent ? 'text-indigo-600' : 'text-slate-700'
          }`}
        >
          {subValue}
        </span>
      </div>
    </div>
  );
}

export function CurrentKpiStandardsContent({
  isLoading,
  errorMessage,
  standards,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  standards: KpiStandard[];
}) {
  const { t } = useTranslation('performance');

  if (isLoading) {
    return <div className="text-sm text-slate-500">{t('standards.loading')}</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (standards.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        {t('standards.empty')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full table-fixed text-left text-sm text-slate-600">
      <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
        <tr>
          <th className="w-1/3 px-6 py-4">{t('standards.table.name')}</th>
          <th className="w-1/3 px-6 py-4">{t('standards.table.description')}</th>
          <th className="w-1/3 px-6 py-4">{t('standards.table.weight')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {standards.map((standard) => (
          <tr key={standard.kpi_id} className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-800">{standard.name}</td>
            <td className="px-6 py-4 text-slate-500">{standard.description ?? '-'}</td>
            <td className="px-6 py-4 font-medium text-slate-800">
              {standard.weight_percent}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
