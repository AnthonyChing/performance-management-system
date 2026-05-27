import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  HelpCircle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { loadManagerData } from '../api';
import type { Team, TeamMember, ReviewItem, DisputeItem } from '../types';

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => loadManagerData());
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({ 'tech-a': true }); // default expand first team
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Reload data if needed
  useEffect(() => {
    setData(loadManagerData());
  }, []);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Calculations for upper cards
  const pendingGoals = data.goals.filter(g => g.status === '待審核' && g.type === '目標');
  const pendingKPIs = data.goals.filter(g => g.status === '待審核' && g.type === 'KPI');
  const totalPendingReviews = pendingGoals.length + pendingKPIs.length;

  const activeDisputes = data.disputes.filter(d => d.status === '待處理');
  const latestDispute = data.disputes.find(d => d.status === '待處理') || data.disputes[0];

  // Calculate team overall progress
  const teamsToDisplay = teamFilter === 'all' 
    ? data.teams 
    : data.teams.filter(t => t.id === teamFilter);

  const getTeamMembers = (teamId: string) => {
    return data.members.filter(m => m.teamId === teamId);
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

      {/* Upper Half: 3 Equal Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: 目標 / KPI 審核 */}
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
            
            <h3 className="text-lg font-bold text-slate-800">目標 / KPI 審核</h3>
            <p className="text-slate-400 text-xs mt-1">本期員工自主擬定之發展計畫</p>
            
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-600 font-medium">待審核目標</span>
                <span className="text-base font-bold text-amber-600 font-mono">{pendingGoals.length} <span className="text-xs text-slate-500 font-normal">個</span></span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-600 font-medium">待審核 KPI</span>
                <span className="text-base font-bold text-amber-600 font-mono">{pendingKPIs.length} <span className="text-xs text-slate-500 font-normal">個</span></span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link 
              to="/manager/goals" 
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              前往目標管理 <ArrowRight className="w-4 h-4" />
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
                  <span className="font-mono text-emerald-600 font-bold">68.7%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: '68.7%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>進度最前線</span>
                  <span className="font-semibold text-slate-700">陳大文 (82%)</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>待追蹤留意</span>
                  <span className="font-semibold text-slate-700">趙子龍 (54%)</span>
                </div>
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
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${activeDisputes.length > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                {activeDisputes.length > 0 ? '需緊急處理' : '無待處理'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800">異議處理</h3>
            <p className="text-slate-400 text-xs mt-1">同仁對考核結果提出申覆與校準</p>
            
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2 text-xs rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">未處理之異議</span>
                <span className={`font-mono font-bold ${activeDisputes.length > 0 ? 'text-rose-600 text-base' : 'text-slate-600'}`}>{activeDisputes.length} <span className="text-xs text-slate-500 font-normal">件</span></span>
              </div>
              
              {latestDispute && (
                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/50 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">{latestDispute.memberName}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{latestDispute.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">
                    申覆: {latestDispute.kpiName}
                  </p>
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

      {/* Lower Half: Team Dropdown Selection, and collapsible/dropdown-based list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header of Section */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              直屬團隊名冊
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              下拉各組成員查看詳細本期 KPI progress 及專案進度，並可直接連結組別的目標设定 & 歷史。
            </p>
          </div>
          
          {/* Dropdown Select to filter teams */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            >
              <option value="all">顯示所有組別團隊 ({data.teams.length})</option>
              {data.teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List of Teams acting as custom collapsible panels ("下拉式的團隊列表") */}
        <div className="divide-y divide-slate-100">
          {teamsToDisplay.map((team) => {
            const isExpanded = !!expandedTeams[team.id];
            const members = getTeamMembers(team.id);
            
            return (
              <div key={team.id} className="transition-colors hover:bg-slate-50/40">
                
                {/* Team Row */}
                <div 
                  className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer"
                  onClick={() => toggleTeam(team.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Expand/Collapse caret */}
                    <span className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">{team.name}</h4>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                          成員 {team.memberCount} 人
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span>主管：<span className="text-slate-600 font-semibold">{team.manager}</span></span>
                        <span>•</span>
                        <span>團隊平均進度：<span className="text-indigo-600 font-extrabold">{team.avgProgress}%</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Settings & History Action Buttons on the Right Side of each team row */}
                  {/* We call stopPropagation to avoid opening/collapsing the accordion when clicking buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/manager/goals?team=${team.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      設定
                    </Link>
                    <Link
                      to={`/manager/history?team=${team.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      歷史
                    </Link>
                  </div>
                </div>

                {/* Collapsible Panel Downwards (下拉) containing Team Members */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-slate-100/80 bg-slate-50/50"
                    >
                      <div className="p-6 pt-2 pl-14 pr-6 space-y-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          組內成員詳細進度與狀態
                        </div>

                        {members.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">此組別暫無指派成員</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {members.map(member => (
                              <div 
                                key={member.id} 
                                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={member.avatar} 
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" 
                                  />
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-800">{member.name}</h5>
                                    <p className="text-[11px] text-slate-400">{member.role}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{member.email}</p>
                                  </div>
                                </div>

                                <div className="w-1/3 flex flex-col justify-end text-right">
                                  <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1">
                                    <span>本期進度</span>
                                    <span className="font-bold text-slate-800">{member.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                                    <div 
                                      className="h-1.5 rounded-full bg-indigo-500" 
                                      style={{ width: `${member.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 self-end px-1.5 py-0.5 rounded">
                                    {member.goalsCount} 個目標/KPI
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      </div>
      
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
    </div>
  );
}
