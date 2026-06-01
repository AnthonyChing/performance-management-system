import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  getMyHistoricalKpiResults,
  type KpiResultSummary,
  type KpiStandard,
} from '../api';
import { CurrentKpiStandardsContent } from './CurrentKPI';

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

  return '歷史 KPI 詳情載入失敗。';
}

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) return '-';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function formatActualTarget(value: number | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value}${unit ? ` ${unit}` : ''}`;
}

function formatDate(value: string | null | undefined) {
  return value ?? '-';
}

const statusLabels: Record<string, string> = {
  finalized: '已入檔',
  confirmed: '已確認',
  disputed: '已提出異議',
  completed: '已完成',
  pending_confirmation: '待確認',
  not_published: '尚未公佈',
};

function formatStatus(status: string | null | undefined) {
  if (!status) return '-';
  return statusLabels[status] ?? status;
}

export default function HistoryKPIDetail() {
  const [activeTab, setActiveTab] = useState<'standards' | 'results'>('standards');
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [standards, setStandards] = useState<KpiStandard[]>([]);
  const [result, setResult] = useState<KpiResultSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setErrorMessage('缺少歷史 KPI 週期 ID。');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadHistoricalKpiDetail() {
      setIsLoading(true);

      try {
        const response = await getMyHistoricalKpiResults(
          { page: 1, page_size: 100, cycle_id: id },
          { signal: controller.signal },
        );

        if (!isMounted) return;
        setStandards(response.standards ?? []);
        setResult(response.result ?? null);
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

    loadHistoricalKpiDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, location.pathname, location.search, navigate]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {result?.cycle?.name ?? '歷史 KPI 績效指標與評估'}
          {result?.cycle?.period_label && (
            <span className="font-normal text-slate-600 text-lg">
              （所屬考核週期：{result.cycle.period_label}）
            </span>
          )}
        </h1>
        <div className="text-sm text-slate-500 mt-1 flex px-1 breadcrumbs">
          主控台 <ChevronRight className="w-3 h-3 mx-1 mt-1" />
          <Link to="/performance/history" className="hover:text-slate-800">歷史 KPI 頁面</Link>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'standards' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('standards')}
        >
          KPI 標準
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
          考核結果
          {activeTab === 'results' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-lg"></div>
          )}
        </button>
      </div>

      {activeTab === 'standards' && (
        <CurrentKpiStandardsContent
          isLoading={isLoading}
          errorMessage={errorMessage}
          standards={standards}
        />
      )}

      {activeTab === 'results' && (
        <HistoryKpiResultsContent
          isLoading={isLoading}
          errorMessage={errorMessage}
          result={result}
        />
      )}
    </div>
  );
}

export function HistoryKpiResultsContent({
  isLoading,
  errorMessage,
  result,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  result: KpiResultSummary | null;
}) {
  if (isLoading) {
    return <div className="text-sm text-slate-500">載入歷史 KPI 考核結果中...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-red-700">{errorMessage}</div>;
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
        目前沒有可顯示的歷史 KPI 考核結果。
      </div>
    );
  }

  const scoreSummary = result.score_summary;
  const kpiResults = result.kpi_results ?? [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <ResultSummaryCard
          label="績效總分"
          value={formatValue(scoreSummary?.performance_score ?? result.performance_score)}
          subLabel="績效等級"
          subValue={result.final_grade ?? '-'}
          accent
        />
        <ResultSummaryCard
          label="KPI 達成率"
          value={formatValue(scoreSummary?.kpi_achievement_percent, '%')}
          subLabel="加權分數"
          subValue={formatValue(result.weighted_score)}
        />
        <ResultSummaryCard
          label="主管評核"
          value={formatValue(scoreSummary?.manager_review_score ?? result.review_score)}
          subLabel="主管評語"
          subValue={result.manager_evaluation?.comment ?? '-'}
        />
        <ResultSummaryCard
          label="結果狀態"
          value={formatStatus(result.status)}
          subLabel="最後更新"
          subValue={formatDate(result.updated_at ?? result.reviewed_at)}
        />
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-2">
          各項 KPI 達成情況
        </h3>

        {kpiResults.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            此歷史週期沒有可顯示的 KPI 達成明細。
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
                        (實際值: {actualText} / 目標值: {targetText})
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
        <div className="flex items-center text-sm text-slate-600 md:mb-0">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 text-slate-500">✓</div>
          此考核週期的評估結果已正式入檔且不可更改。
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
