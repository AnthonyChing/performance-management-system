import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RefreshCw } from 'lucide-react';
import { fetchAppeals, fetchAppealDetail, respondToAppeal } from '../api';
import type { Appeal } from '../types';
import type { AppealStatus, DisputeStatusFilter } from '../types';
import { APPEAL_STATUS_LABELS, isAppealOpen } from '../types';
import DisputeListSidebar from '../components/DisputeListSidebar';
import DisputeDetailHeader from '../components/DisputeDetailHeader';
import DisputeDetailInfo from '../components/DisputeDetailInfo';
import DisputeResponseThread from '../components/DisputeResponseThread';
import DisputeResponseForm from '../components/DisputeResponseForm';
import DisputeEmptyState from '../components/DisputeEmptyState';

/** Hardcoded team ID until auth context is available */
const DEFAULT_TEAM_ID = 'team_default';

const STATUS_TABS: Array<{ id: DisputeStatusFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'submitted', label: '已提交' },
  { id: 'under_review', label: '審核中' },
  { id: 'need_more_info', label: '需補充' },
  { id: 'approved', label: '已核准' },
  { id: 'rejected', label: '已駁回' },
  { id: 'cancelled', label: '已取消' },
];

export default function Dispute() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team') || DEFAULT_TEAM_ID;

  // Data state
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load appeals list
  const loadAppeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const data = await fetchAppeals(teamId, statusParam);
      setAppeals(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入申覆列表失敗';
      setError(message);
      setAppeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, statusFilter]);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  // Load selected appeal detail
  const loadDetail = useCallback(
    async (appealId: string) => {
      setIsDetailLoading(true);
      try {
        const detail = await fetchAppealDetail(teamId, appealId);
        setSelectedAppeal(detail);
      } catch (err) {
        console.error('Failed to load appeal detail:', err);
        setSelectedAppeal(null);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [teamId],
  );

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setSelectedAppeal(null);
    }
  }, [selectedId, loadDetail]);

  // Auto-select first item when list changes
  useEffect(() => {
    if (appeals.length > 0 && !selectedId) {
      setSelectedId(appeals[0].id);
    } else if (appeals.length === 0) {
      setSelectedId(null);
    }
  }, [appeals, selectedId]);

  // Client-side search filter on the already-loaded appeals
  const filteredAppeals = useMemo(() => {
    if (!searchQuery.trim()) return appeals;
    const q = searchQuery.toLowerCase();
    return appeals.filter(
      (a) =>
        a.case_no?.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.filed_by.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q),
    );
  }, [appeals, searchQuery]);

  // Handle response submission
  const handleRespond = async (responseText: string, isFinal: boolean) => {
    if (!selectedId || !selectedAppeal) return;

    setIsSubmitting(true);
    try {
      const updated = await respondToAppeal(teamId, selectedId, responseText, isFinal);
      setSelectedAppeal(updated);
      // Refresh the list to reflect status changes
      await loadAppeals();
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交回覆失敗';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = appeals.filter((a) => isAppealOpen(a.status)).length;

  // 403 permission check — if the API returned FORBIDDEN, show full-page error
  if (apiError && apiError.status === 403) {
    return (
      <ApiErrorBanner
        status={403}
        code={apiError.code}
        message={apiError.message}
        details={apiError.details}
        fullPage
        onRetry={() => { clearApiError(); reloadData(); }}
      />
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* API Error Banner (inline for 400/404/409) */}
      {apiError && apiError.status !== 403 && (
        <ApiErrorBanner
          status={apiError.status}
          code={apiError.code}
          message={apiError.message}
          details={apiError.details}
          onRetry={() => { clearApiError(); reloadData(); }}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">績效異議與申覆處理</h1>
          <p className="text-slate-500 text-sm mt-1">
            審查部屬提交的績效異議申請，回覆處理意見或做出最終裁決。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            loadAppeals();
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusFilter(tab.id);
              setSelectedId(null);
            }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 whitespace-nowrap">
            <Filter className="w-4 h-4 text-indigo-500" />
            團隊：
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 font-mono">
            {teamId}
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
          待處理：{' '}
          <span className="text-indigo-600 text-sm">{pendingCount}</span> 件
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <strong>錯誤：</strong> {error}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <DisputeListSidebar
            appeals={filteredAppeals}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
          />
        </div>

        {/* Right Detail Area */}
        <div className="w-full lg:w-2/3">
          {isDetailLoading ? (
            <div className="h-[400px] flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-sm text-slate-400 animate-pulse">載入案件詳情中...</div>
            </div>
          ) : selectedAppeal ? (
            <div className="space-y-4">
              <DisputeDetailHeader appeal={selectedAppeal} />
              <DisputeDetailInfo appeal={selectedAppeal} />
              <DisputeResponseThread responses={selectedAppeal.responses ?? []} />
              <DisputeResponseForm
                isOpen={isAppealOpen(selectedAppeal.status)}
                statusLabel={APPEAL_STATUS_LABELS[selectedAppeal.status] ?? selectedAppeal.status}
                isSubmitting={isSubmitting}
                onSubmit={handleRespond}
              />
            </div>
          ) : (
            <DisputeEmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
