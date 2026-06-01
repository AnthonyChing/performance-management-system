import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { loadManagerOverviewDataAsync } from '../api';
import type { Team, TeamMember, ReviewItem, DisputeItem } from '../types';
import OverviewMetricCards from '../components/OverviewMetricCards';
import OverviewTeamList from '../components/OverviewTeamList';

export default function OverviewPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [goals, setGoals] = useState<ReviewItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Load actual dashboard overview metrics from backend API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadManagerOverviewDataAsync();
        setTeams(data.teams);
        setMembers(data.members);
        setGoals(data.goals);
        setDisputes(data.disputes);

        // Expand first team by default if available
        if (data.teams.length > 0) {
          setExpandedTeams({ [data.teams[0].id]: true });
        }
      } catch (err) {
        console.error('Failed to load manager overview data', err);
        setError('載入管理專區總覽資料失敗，請稍後再試。');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">主管管理專區：總覽</h1>
        <p className="text-slate-500 text-sm mt-1">
          在此掌握您直屬團隊的即時進度、審核目標、處理異議，以及查看每位同仁的歷史績效紀錄。
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">正在彙整團隊名冊與最新績效進度中...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors"
          >
            重新整理
          </button>
        </div>
      ) : (
        <>
          {/* Upper Half: 3 Equal Metrics cards */}
          <OverviewMetricCards goals={goals} disputes={disputes} members={members} />

          {/* Lower Half: Subordinates accordion */}
          <OverviewTeamList
            teams={teams}
            members={members}
            expandedTeams={expandedTeams}
            toggleTeam={toggleTeam}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
          />

          {/* Help Prompt Footer */}
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-indigo-900 space-y-1">
              <p className="font-bold">✨ 主管工作引導秘笈</p>
              <p>
                點擊「設定」可以為該組別同仁設定／審查本期的新目標與 KPI。點擊「歷史」則可查詢該組在往昔考核週期中積累的歷史紀錄。有任何問題可多加利用
                「異議處理」以增進團隊的協商配合度。
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
