import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { listPerformanceCycles, updatePerformanceCycleStatus, listAssessmentStatuses } from '../api';
import { PerformanceCycle } from '../types';
import PublishCycleCard from '../components/PublishCycleCard';

export default function PublishResults() {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [stats, setStats] = useState<
    Record<
      string,
      {
        totalEmployees: number;
        completedReviews: number;
        gradeDistribution: Record<string, number>;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingCycleId, setPublishingCycleId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch performance cycles
      const cycleResponse = await listPerformanceCycles({ page_size: 100 });
      const activeCycles = cycleResponse.data || [];
      setCycles(activeCycles);

      // Fetch assessment statuses for each cycle in parallel
      const statsMap: typeof stats = {};
      await Promise.all(
        activeCycles.map(async (cycle) => {
          try {
            const statusResponse = await listAssessmentStatuses({
              cycle_id: cycle.id,
              page_size: 1000,
            });
            const reviews = statusResponse.data || [];

            const total = reviews.length;
            const completed = reviews.filter((r) => r.reviewStatus === 'completed').length;

            const distribution: Record<string, number> = {
              outstanding: 0,
              exceeds_expectations: 0,
              meets_expectations: 0,
              needs_improvement: 0,
              unacceptable: 0,
            };

            reviews.forEach((r) => {
              const rating = r.finalRating as string;
              if (rating && distribution[rating] !== undefined) {
                distribution[rating]++;
              }
            });

            statsMap[cycle.id] = {
              totalEmployees: total,
              completedReviews: completed,
              gradeDistribution: distribution,
            };
          } catch (err) {
            console.error(`Failed to fetch stats for cycle ${cycle.id}:`, err);
            statsMap[cycle.id] = {
              totalEmployees: 0,
              completedReviews: 0,
              gradeDistribution: {
                outstanding: 0,
                exceeds_expectations: 0,
                meets_expectations: 0,
                needs_improvement: 0,
                unacceptable: 0,
              },
            };
          }
        })
      );
      setStats(statsMap);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err?.message || '載入資料時發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublish = async (id: string) => {
    if (confirm('確定要發佈此考核結果嗎？發佈後各同仁將會收到成績通知，且不可再撤回或修改評核內容！')) {
      try {
        setPublishingCycleId(id);
        const updated = await updatePerformanceCycleStatus(id, 'results_published');
        // Update local cycle state
        setCycles((prev) => prev.map((c) => (c.id === id ? updated : c)));
        alert('績效考核結果已成功發佈！同仁將收到信件通知。');
      } catch (err: any) {
        console.error('Publish error:', err);
        alert(err?.message || '發佈失敗，請稍後再試。');
      } finally {
        setPublishingCycleId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">正在下載考核週期與進度...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold">載入失敗</h4>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">發佈考核結果</h1>
          <p className="text-slate-500 text-sm mt-1">檢視各考核週期整體驗收情況，並將最終考評結果公告發送給全體同仁與主管。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4 col-span-full">
          <AlertCircle className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-indigo-900">發佈聲明與注意事項</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              僅有在所有單位、所有成員皆完成「直屬主管評分」與「雙方績效面談」後，方可解鎖發佈功能。
              一旦發布，考評記錄將永久封存至歷史紀錄中供員工本人查詢，不可逆轉。
            </p>
          </div>
        </div>

        {cycles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            目前無任何考核週期
          </div>
        ) : (
          cycles.map((cycle) => {
            const cycleStats = stats[cycle.id] || {
              totalEmployees: 0,
              completedReviews: 0,
              gradeDistribution: {
                outstanding: 0,
                exceeds_expectations: 0,
                meets_expectations: 0,
                needs_improvement: 0,
                unacceptable: 0,
              },
            };

            return (
              <PublishCycleCard
                key={cycle.id}
                cycle={cycle}
                completedReviews={cycleStats.completedReviews}
                totalEmployees={cycleStats.totalEmployees}
                gradeDistribution={cycleStats.gradeDistribution}
                onPublish={handlePublish}
                isPublishing={publishingCycleId === cycle.id}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
