import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, MessageSquare, ArrowRight } from 'lucide-react';
import type { ReviewItem, DisputeItem, TeamMember } from '../types';

interface OverviewMetricCardsProps {
  goals: ReviewItem[];
  disputes: DisputeItem[];
  members: TeamMember[];
}

export default function OverviewMetricCards({ goals, disputes, members }: OverviewMetricCardsProps) {
  const pendingGoals = goals.filter((g) => g.status === '待審核' && g.type === '目標');

  const activeDisputes = disputes.filter((d) => d.status === '待處理');
  const latestDispute = disputes.find((d) => d.status === '待處理') || disputes[0];

  // Team average progress
  const avgProgressPercent =
    members.length > 0
      ? Math.round((members.reduce((sum, m) => sum + m.progress, 0) / members.length) * 10) / 10
      : 0;

  // Find leading and trailing members
  const sortedMembers = [...members].sort((a, b) => b.progress - a.progress);
  const leadingMember = sortedMembers[0];
  const trailingMember = sortedMembers[sortedMembers.length - 1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: 目標審核 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5 animate-pulse" />
            </span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
              待您審核
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-800">目標審核</h3>
          <p className="text-slate-400 text-xs mt-1">本期員工自主擬定之發展計畫</p>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-sm text-slate-600 font-medium">待審核目標</span>
              <span className="text-base font-bold text-amber-600 font-mono">
                {pendingGoals.length} <span className="text-xs text-slate-500 font-normal">個</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            to="/manager/goals"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            前往目標管理與審核 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Card 2: 團隊進度 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              進度穩定
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-800">團隊進度</h3>
          <p className="text-slate-400 text-xs mt-1">所轄團隊當前綜合平均目標達成率</p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>全團隊平均達成率</span>
                <span className="font-mono text-emerald-600 font-bold">{avgProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${avgProgressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {leadingMember && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>進度最前線</span>
                  <span className="font-semibold text-slate-700">
                    {leadingMember.name} ({leadingMember.progress}%)
                  </span>
                </div>
              )}
              {trailingMember && trailingMember.id !== leadingMember?.id && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>待追蹤留意</span>
                  <span className="font-semibold text-slate-700">
                    {trailingMember.name} ({trailingMember.progress}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            to="/manager/history"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            查看歷史推進紀錄 <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Card 3: 異議處理 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                activeDisputes.length > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {activeDisputes.length > 0 ? '需緊急處理' : '無待處理'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-800">異議處理</h3>
          <p className="text-slate-400 text-xs mt-1">同仁對考核結果提出申覆與校準</p>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-2 text-xs rounded-lg border border-slate-100">
              <span className="text-slate-500 font-medium">未處理之異議</span>
              <span
                className={`font-mono font-bold ${activeDisputes.length > 0 ? 'text-rose-600 text-base' : 'text-slate-600'}`}
              >
                {activeDisputes.length} <span className="text-xs text-slate-500 font-normal">件</span>
              </span>
            </div>

            {latestDispute && (
              <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/50 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-700">{latestDispute.memberName}</span>
                  <span className="text-slate-400 text-[10px] font-mono">{latestDispute.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 truncate">申覆原因: {latestDispute.kpiName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            to="/manager/dispute"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            處理申覆與異議 <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
