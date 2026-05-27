import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileWarning, 
  CheckCircle2, 
  XSquare, 
  HelpCircle, 
  Calendar,
  MessageSquare,
  ClipboardList,
  AlertCircle,
  Save,
  Link as LinkIcon,
  Filter,
  Search,
  Download,
  ExternalLink,
  Check,
  FileText,
  User,
  ChevronRight,
  ChevronDown,
  Flag
} from 'lucide-react';
import { loadManagerData, updateDisputeStatus } from '../api';
import type { DisputeItem } from '../types';

export default function Dispute() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';

  const [data, setData] = useState(() => loadManagerData());
  const [teamFilter, setTeamFilter] = useState<string>(initialTeam);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  
  // For the active form
  const [responseText, setResponseText] = useState('');
  const [adjustedScore, setAdjustedScore] = useState<number | ''>('');
  const [showApproved, setShowApproved] = useState(false);

  useEffect(() => {
    const queryTeam = searchParams.get('team');
    if (queryTeam) {
      setTeamFilter(queryTeam);
    }
  }, [searchParams]);

  useEffect(() => {
    setData(loadManagerData());
  }, []);

  const reloadData = () => {
    setData(loadManagerData());
  };

  const filteredDisputes = useMemo(() => {
    return data.disputes.filter(d => {
      const matchesTeam = teamFilter === 'all' || d.teamId === teamFilter;
      const matchesSearch = d.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.kpiName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTeam && matchesSearch;
    });
  }, [data.disputes, teamFilter, searchQuery]);

  // Select the first dispute by default if none selected
  useEffect(() => {
    if (!selectedDisputeId && filteredDisputes.length > 0) {
      setSelectedDisputeId(filteredDisputes[0].id);
    } else if (filteredDisputes.length === 0) {
      setSelectedDisputeId(null);
    }
  }, [filteredDisputes, selectedDisputeId]);

  const activeDispute = useMemo(() => {
    return filteredDisputes.find(d => d.id === selectedDisputeId) || null;
  }, [filteredDisputes, selectedDisputeId]);

  // When active dispute changes, reset the form state
  useEffect(() => {
    if (activeDispute) {
      setResponseText(activeDispute.managerComment || '');
      setAdjustedScore(
        activeDispute.adjustedScore !== undefined 
          ? activeDispute.adjustedScore 
          : activeDispute.requestedScore
      );
    }
  }, [activeDispute]);

  const handleApproveDispute = () => {
    if (!activeDispute) return;
    
    if (!responseText.trim()) {
      alert('請填寫主管裁決說明 / 最終意見！');
      return;
    }
    
    const finalScore = adjustedScore === '' ? activeDispute.requestedScore : adjustedScore;
    const success = updateDisputeStatus(activeDispute.id, '已同意', responseText, finalScore);
    
    if (success) {
      reloadData();
      alert('已成功裁決並更新分數！將通知該同仁。');
    }
  };

  const pendingCount = data.disputes.filter(d => d.status === '待處理').length;

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 2);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">績效異議與申覆處理 (Resolution Center)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, analyze, and finalize employee performance rating appeals.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            進階篩選
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            匯出紀錄 (Export Log)
          </button>
        </div>
      </div>

      {/* Filter Toolbar (as requested) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 whitespace-nowrap">
            <Filter className="w-4 h-4 text-indigo-500" />
            團隊過濾：
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">所有團隊的異議申請</option>
            {data.teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
          總計待處理： <span className="text-indigo-600 text-sm">{pendingCount}</span> 件
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Sidebar: List of Appeals */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
            
            {/* List Header */}
            <div className="p-4 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">申覆案件清單 (Cases)</h2>
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {filteredDisputes.length}
                </span>
              </div>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="搜尋姓名或 KPI..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredDisputes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  目前沒有符合條件的資料
                </div>
              ) : (
                <>
                  {filteredDisputes.filter(d => d.status !== '已同意').map(dispute => {
                    const isSelected = selectedDisputeId === dispute.id;
                    const isPending = dispute.status === '待處理';
                    const isApproved = dispute.status === '已同意';

                    return (
                      <div 
                        key={dispute.id}
                        onClick={() => setSelectedDisputeId(dispute.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                              {getInitials(dispute.memberName)}
                            </div>
                            <div>
                              <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {dispute.memberName}
                              </h4>
                              <p className="text-[10px] text-slate-500 line-clamp-1 truncate w-32" title={dispute.kpiName}>
                                {dispute.kpiName}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dispute.createdAt.substring(5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {isPending && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded block w-max uppercase">
                              待處理 (Pending)
                            </span>
                          )}
                          {dispute.status === '已駁回' && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-600 rounded block w-max uppercase">
                              已駁回 (Rejected)
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded truncate max-w-[120px]">
                            {dispute.kpiName.substring(0, 15)}...
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredDisputes.filter(d => d.status === '已同意').length > 0 && (
                    <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => setShowApproved(!showApproved)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          已核准案件 ({filteredDisputes.filter(d => d.status === '已同意').length})
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showApproved ? 'rotate-180' : ''}`} />
                      </button>
                      {showApproved && (
                        <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                          {filteredDisputes.filter(d => d.status === '已同意').map(dispute => {
                            const isSelected = selectedDisputeId === dispute.id;
                            
                            return (
                              <div 
                                key={dispute.id}
                                onClick={() => setSelectedDisputeId(dispute.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                                      {getInitials(dispute.memberName)}
                                    </div>
                                    <div>
                                      <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {dispute.memberName}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 line-clamp-1 truncate w-32" title={dispute.kpiName}>
                                        {dispute.kpiName}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {dispute.createdAt.substring(5)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded block w-max uppercase">
                                    已核准 (Approved)
                                  </span>
                                  <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded truncate max-w-[120px]">
                                    {dispute.kpiName.substring(0, 15)}...
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* Right Main Area: Appeal Details */}
        <div className="w-full lg:w-2/3">
          {activeDispute ? (
            <div className="space-y-4">
              
              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
                <div className="absolute top-6 right-6">
                  <a href="#" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800">
                    <ExternalLink className="w-3.5 h-3.5" />
                    查看完整檔案 (Profile)
                  </a>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 shrink-0">
                    {getInitials(activeDispute.memberName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{activeDispute.memberName}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeDispute.teamId.toUpperCase()} 部門同仁 • {activeDispute.period}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1 mt-2">
                      申覆單號: #APP-{activeDispute.id}-{activeDispute.createdAt.replace(/-/g, '')}
                    </p>
                  </div>
                </div>

              </div>

              {/* Data Grid: Details & Materials */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* Left Col: Appeal Details */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <AlertCircle className="w-4 h-4 text-indigo-500" />
                    申覆詳情 (Appeal Details)
                  </h3>
                  
                  <div className="grid grid-cols-2 justify-between border-b border-slate-100 pb-4 relative">
                    {/* Divider line component */}
                    <div className="absolute left-1/2 top-2 bottom-2 w-px bg-slate-100"></div>
                    
                    <div className="text-center pr-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">原始評分</p>
                      <div className="text-3xl font-extrabold text-slate-800 font-mono tracking-tighter">
                        {activeDispute.originalScore}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {activeDispute.originalScore >= 80 ? '符合預期' : '需改善'}
                      </p>
                    </div>
                    <div className="text-center pl-2">
                      <p className="text-[10px] font-bold text-indigo-500 mb-1">員工期望分數</p>
                      <div className="text-3xl font-extrabold text-indigo-600 font-mono tracking-tighter">
                        {activeDispute.requestedScore}
                      </div>
                      <p className="text-[10px] text-indigo-500 mt-1">優於預期 (?)</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 mb-2 font-mono uppercase tracking-wider">
                      同仁陳述理由 (Employee Statement)
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs tracking-wide leading-relaxed text-slate-600 shadow-inner h-40 overflow-y-auto">
                      {activeDispute.reason}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: Final Resolution */}
              <div className="bg-white border-2 border-indigo-50 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2">
                  <Save className="w-4 h-4 text-indigo-500" />
                  最終裁決紀錄 (Final Resolution)
                </h3>

                <div className="flex flex-col md:flex-row gap-6">
                  
                  <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-bold text-slate-600 mb-2 font-mono uppercase">
                      調整後最終分數 (Adjusted Score)
                    </label>
                    <input 
                      type="number"
                      min={0}
                      max={100}
                      value={adjustedScore}
                      onChange={(e) => setAdjustedScore(Number(e.target.value))}
                      disabled={activeDispute.status !== '待處理'}
                      className="w-full text-3xl font-extrabold text-slate-800 font-mono border border-slate-200 rounded-lg p-3 text-center outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Rating scale: 0 - 100
                    </p>
                  </div>

                  <div className="w-full md:w-2/3">
                    <label className="block text-[10px] font-bold text-slate-600 mb-2 font-mono uppercase">
                      裁決理由與最終意見 (Rationale & Comments) <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      placeholder="Enter detailed justification for the final score adjustment..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      disabled={activeDispute.status !== '待處理'}
                      className="w-full h-32 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 leading-relaxed shadow-inner"
                    ></textarea>
                  </div>

                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 flex-wrap">
                  {activeDispute.status === '待處理' ? (
                    <>
                      <button 
                        onClick={handleApproveDispute}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
                      >
                        <Check className="w-4 h-4" />
                        同意並核准變更 (Resolve & Notify Employee)
                      </button>
                    </>
                  ) : (
                    <div className="text-xs font-bold flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      狀態已鎖定：{activeDispute.status}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-500">無選取的申覆案件</h3>
              <p className="text-xs text-slate-400 mt-1">請由左方列表點選一項以查看詳細內容並進行裁決。</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
