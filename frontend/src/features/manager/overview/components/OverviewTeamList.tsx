import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  History,
} from 'lucide-react';
import type { Team, TeamMember } from '../types';

interface OverviewTeamListProps {
  teams: Team[];
  members: TeamMember[];
  expandedTeams: Record<string, boolean>;
  toggleTeam: (teamId: string) => void;
  teamFilter: string;
  setTeamFilter: (team: string) => void;
}

export default function OverviewTeamList({
  teams,
  members,
  expandedTeams,
  toggleTeam,
  teamFilter,
  setTeamFilter,
}: OverviewTeamListProps) {
  const getTeamMembers = (teamId: string) => {
    return members.filter((m) => m.teamId === teamId);
  };

  const teamsToDisplay =
    teamFilter === 'all' ? teams : teams.filter((t) => t.id === teamFilter);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header of Section */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            直屬團隊名冊
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            下拉各組成員查看詳細本期 KPI progress 及專案進度，並可直接連結組別的目標設定 & 歷史。
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
            <option value="all">顯示所有組別團隊 ({teams.length})</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Teams acting as custom collapsible panels */}
      <div className="divide-y divide-slate-100">
        {teamsToDisplay.map((team) => {
          const isExpanded = !!expandedTeams[team.id];
          const teamMembers = getTeamMembers(team.id);

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
                      <span>
                        主管：<span className="text-slate-600 font-semibold">{team.manager}</span>
                      </span>
                      <span>•</span>
                      <span>
                        團隊平均進度：<span className="text-indigo-600 font-extrabold">{team.avgProgress}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settings & History Action Buttons */}
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

              {/* Collapsible Panel containing Team Members */}
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

                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">此組別暫無指派成員</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {member.avatar ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full border border-slate-100 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {member.name.charAt(0)}
                                  </div>
                                )}
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
                                    className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
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
  );
}
