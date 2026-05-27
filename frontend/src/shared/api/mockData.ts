// Mock data file for Manager Zone (主管專區) API / storage simulation

export interface Team {
  id: string;
  name: string;
  manager: string;
  memberCount: number;
  avgProgress: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  progress: number;
  goalsCount: number;
}

export interface ReviewItem {
  id: string;
  memberId: string;
  memberName: string;
  teamId: string;
  title: string;
  type: '目標' | 'KPI';
  status: '待審核' | '進行中' | '已否決' | '已評估';
  weight?: number;
  target?: string;
  dueDate: string;
  score?: number;
  evaluationComment?: string;
}

export interface DisputeItem {
  id: string;
  memberId: string;
  memberName: string;
  teamId: string;
  period: string;
  kpiName: string;
  originalScore: number;
  requestedScore: number;
  reason: string;
  status: '待處理' | '已同意' | '已駁回';
  createdAt: string;
  managerComment?: string;
  adjustedScore?: number;
  evidenceFiles?: string[];
}

const DEFAULT_TEAMS: Team[] = [
  { id: 'tech-a', name: '技術研發部 A組', manager: '林佳龍', memberCount: 3, avgProgress: 76 },
  { id: 'design', name: '產品設計組', manager: '林佳龍', memberCount: 2, avgProgress: 58 },
  { id: 'marketing', name: '市場營銷組', manager: '林佳龍', memberCount: 2, avgProgress: 65 }
];

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: 'm1', teamId: 'tech-a', name: '陳大文', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', role: '資深軟體工程師', email: 'david.chen@comp.com', progress: 82, goalsCount: 4 },
  { id: 'm2', teamId: 'tech-a', name: '林小明', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', role: '網頁工程師', email: 'leo.lin@comp.com', progress: 72, goalsCount: 3 },
  { id: 'm3', teamId: 'tech-a', name: '張美玲', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', role: '後端工程師', email: 'mary.chang@comp.com', progress: 74, goalsCount: 3 },
  { id: 'm4', teamId: 'design', name: '王小華', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80', role: 'UI/UX 設計師', email: 'sarah.wang@comp.com', progress: 62, goalsCount: 3 },
  { id: 'm5', teamId: 'design', name: '趙子龍', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', role: '視覺設計師', email: 'roy.chao@comp.com', progress: 54, goalsCount: 2 },
  { id: 'm6', teamId: 'marketing', name: '李明建', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80', role: '社群行銷專員', email: 'ken.lee@comp.com', progress: 68, goalsCount: 2 },
  { id: 'm7', teamId: 'marketing', name: '蔡美美', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', role: '廣告投放專員', email: 'amy.tsai@comp.com', progress: 62, goalsCount: 3 }
];

const DEFAULT_GOALS: ReviewItem[] = [
  { id: 'g1', memberId: 'm1', memberName: '陳大文', teamId: 'tech-a', title: '優化核心產品 API 延遲至 100ms 內', type: 'KPI', status: '待審核', weight: 35, target: '生產環境 API 延遲低於 100ms', dueDate: '2026-06-30' },
  { id: 'g2', memberId: 'm1', memberName: '陳大文', teamId: 'tech-a', title: '完成 Next.js 微前端架構評估與 POC 專案', type: '目標', status: '待審核', dueDate: '2026-07-15' },
  { id: 'g3', memberId: 'm2', memberName: '林小明', teamId: 'tech-a', title: '登入驗證模組與狀態管理重構', type: 'KPI', status: '待審核', weight: 40, target: '覆蓋高達 90% 各極端場景且零錯誤率', dueDate: '2026-06-30' },
  { id: 'g4', memberId: 'm4', memberName: '王小華', teamId: 'design', title: '建構團隊 Design System 基礎組件庫 1.0 版本', type: '目標', status: '待審核', dueDate: '2026-08-01' },
  { id: 'g5', memberId: 'm6', memberName: '李明建', teamId: 'marketing', title: '第二季各品牌社群媒體覆蓋率與轉化提升 30%', type: 'KPI', status: '待審核', weight: 50, target: '全管道轉化率提升 30%', dueDate: '2026-06-30' },
  { id: 'g6', memberId: 'm1', memberName: '陳大文', teamId: 'tech-a', title: '自動化單元測試覆蓋率提升至 85%', type: 'KPI', status: '進行中', weight: 25, target: '測試覆蓋率 85% 以上', dueDate: '2026-06-15' },
  { id: 'g7', memberId: 'm3', memberName: '張美玲', teamId: 'tech-a', title: '高負載資料庫讀寫分離與調優編製', type: '目標', status: '進行中', dueDate: '2026-06-30' },
  { id: 'g8', memberId: 'm5', memberName: '趙子龍', teamId: 'design', title: '形象官網 Landing Page 整體視覺改版與優化', type: 'KPI', status: '待審核', weight: 60, target: '設計稿定稿並獲得一級核准', dueDate: '2026-06-25' }
];

const DEFAULT_DISPUTES: DisputeItem[] = [
  { id: 'd1', memberId: 'm2', memberName: '林小明', teamId: 'tech-a', period: '2025 第二期績效考核', kpiName: '前端自適應切版品質與自動檢測率', originalScore: 72, requestedScore: 88, reason: '此項目的評級偏低。實際上我在本期完美交付了響應式重構，並手動主導編制了 12 套驗收方案。雖自動化元件測試由外部協作，但全域基礎工作皆由我部署成型，自評應有 88 分之高度。', status: '待處理', createdAt: '2026-05-24', evidenceFiles: ['元件單元測試覆蓋率報表.pdf', 'Jira_Ticket_交付證明.png'] },
  { id: 'd2', memberId: 'm4', memberName: '王小華', teamId: 'design', period: '2025 第二期績效考核', kpiName: 'UI 設計系統定義之元件覆蓋率', originalScore: 78, requestedScore: 92, reason: '原考核指稱交付元件不完全，但主因是產品規劃端（PM）有 3 次規格重大變更，我在規格變更後平均 48 小時內皆立即產出新版迭代，準時完成度仍極佳，懇請主管參照需求變更單予以加分。', status: '待處理', createdAt: '2026-05-23', evidenceFiles: ['PM_規格變更簽名單.pdf'] },
  { id: 'd3', memberId: 'm7', memberName: '蔡美美', teamId: 'marketing', period: '2025 第一期績效考核', kpiName: '廣告投放轉化率與目標 ROI $10 達成指標', originalScore: 70, requestedScore: 82, reason: '第一季因年節效應，市場廣告競價成本均值上漲 45%，在非常高昂之環境下，我們的產品轉化相比對手依舊卓越，外部不可抗拒力因素應於評估比重折抵考量。', status: '已同意', createdAt: '2026-05-15', managerComment: '考量到第一季度競價成本普遍暴漲的客觀市場情況，同意調整，將此項目修正為 82 分。', adjustedScore: 82 }
];

export function loadManagerData() {
  const teams = localStorage.getItem('pm_teams');
  const members = localStorage.getItem('pm_members');
  const goals = localStorage.getItem('pm_goals');
  const disputes = localStorage.getItem('pm_disputes');

  if (!teams || !members || !goals || !disputes) {
    localStorage.setItem('pm_teams', JSON.stringify(DEFAULT_TEAMS));
    localStorage.setItem('pm_members', JSON.stringify(DEFAULT_MEMBERS));
    localStorage.setItem('pm_goals', JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem('pm_disputes', JSON.stringify(DEFAULT_DISPUTES));
    return {
      teams: DEFAULT_TEAMS,
      members: DEFAULT_MEMBERS,
      goals: DEFAULT_GOALS,
      disputes: DEFAULT_DISPUTES
    };
  }

  return {
    teams: JSON.parse(teams),
    members: JSON.parse(members),
    goals: JSON.parse(goals),
    disputes: JSON.parse(disputes)
  };
}

export function saveManagerData(data: { teams?: Team[]; members?: TeamMember[]; goals?: ReviewItem[]; disputes?: DisputeItem[] }) {
  if (data.teams) localStorage.setItem('pm_teams', JSON.stringify(data.teams));
  if (data.members) localStorage.setItem('pm_members', JSON.stringify(data.members));
  if (data.goals) localStorage.setItem('pm_goals', JSON.stringify(data.goals));
  if (data.disputes) localStorage.setItem('pm_disputes', JSON.stringify(data.disputes));
}

export function updateGoalStatus(id: string, status: '待審核' | '進行中' | '已否決') {
  const data = loadManagerData();
  const index = data.goals.findIndex(g => g.id === id);
  if (index !== -1) {
    data.goals[index].status = status;
    saveManagerData({ goals: data.goals });
    return true;
  }
  return false;
}

export function updateDisputeStatus(id: string, status: '待處理' | '已同意' | '已駁回', comment?: string, adjustedScore?: number) {
  const data = loadManagerData();
  const index = data.disputes.findIndex(d => d.id === id);
  if (index !== -1) {
    data.disputes[index].status = status;
    if (comment !== undefined) {
      data.disputes[index].managerComment = comment;
    }
    if (adjustedScore !== undefined) {
      data.disputes[index].adjustedScore = adjustedScore;
    }
    saveManagerData({ disputes: data.disputes });
    return true;
  }
  return false;
}

export function editGoal(id: string, updates: Partial<ReviewItem>) {
  const data = loadManagerData();
  const index = data.goals.findIndex(g => g.id === id);
  if (index !== -1) {
    data.goals[index] = { ...data.goals[index], ...updates };
    saveManagerData({ goals: data.goals });
    return true;
  }
  return false;
}

export function evaluateGoal(id: string, score: number, comment: string) {
  const data = loadManagerData();
  const index = data.goals.findIndex(g => g.id === id);
  if (index !== -1) {
    data.goals[index].status = '已評估';
    data.goals[index].score = score;
    data.goals[index].evaluationComment = comment;
    saveManagerData({ goals: data.goals });
    return true;
  }
  return false;
}

export function addMockGoal(goal: Partial<ReviewItem>) {
  const data = loadManagerData();
  const newGoal: ReviewItem = {
    id: `g_new_${Date.now()}`,
    memberId: goal.memberId || 'm1',
    memberName: goal.memberName || '陳大文',
    teamId: goal.teamId || 'tech-a',
    title: goal.title || '新增項目',
    type: goal.type || '目標',
    status: goal.status || '待審核',
    weight: goal.weight,
    target: goal.target,
    dueDate: goal.dueDate || '2026-06-30'
  };
  data.goals.unshift(newGoal);
  saveManagerData({ goals: data.goals });
  return newGoal;
}

import { Goal } from '../types';

export const COMMON_MOCK_GOALS: Goal[] = [
  { id: '1', title: '雲端架構遷移專案', status: '進行中', progress: 75, dueDate: '2025-10-14' },
  { id: '2', title: 'Q3 內部技術培訓講師', status: '待審核', progress: 30, dueDate: '2025-10-14' },
  { id: '3', title: '跨部門協作流程優化', status: '待處理', progress: 10, dueDate: '2025-10-14' },
  { id: '4', title: '核心模組單元測試覆蓋率', status: '進行中', progress: 92, dueDate: '2025-10-14' },
  { id: '5', title: '電商結帳頁面 UI/UX 改版', status: '進行中', progress: 50, dueDate: '2025-10-14' },
];

export const HISTORY_GOALS_MOCK = [
  { id: 1, period: '2023 第四季度 (Q4) 年度終考', dates: '2023-10-01 至 2023-12-31', avgCompletion: 94.5, count: 10 },
  { id: 2, period: '2023 第三季度 (Q3) 績效考核', dates: '2023-07-01 至 2023-09-30', avgCompletion: 88.2, count: 10 },
  { id: 3, period: '2023 上半年 (H1) 策略考核', dates: '2023-01-01 至 2023-06-30', avgCompletion: 91.0, count: 8 },
  { id: 4, period: '2022 第四季度 (Q4) 年度終考', dates: '2022-10-01 至 2022-12-31', avgCompletion: 85.4, count: 9 },
];

export const HISTORY_KPI_MOCK = [
  { id: 1, period: '2023 第四季度 (Q4) 年度終考', dates: '2023-10-01 至 2023-12-31', totalScore: 94.5, grade: 'A', gradeColor: 'bg-green-100 text-green-700' },
  { id: 2, period: '2023 第三季度 (Q3) 績效考核', dates: '2023-07-01 至 2023-09-30', totalScore: 88.2, grade: 'B+', gradeColor: 'bg-indigo-100 text-indigo-700' },
  { id: 3, period: '2023 上半年 (H1) 策略考核', dates: '2023-01-01 至 2023-06-30', totalScore: 91.0, grade: 'A-', gradeColor: 'bg-green-100 text-green-700' },
  { id: 4, period: '2022 第四季度 (Q4) 年度終考', dates: '2022-10-01 至 2022-12-31', totalScore: 85.4, grade: 'B', gradeColor: 'bg-indigo-100 text-indigo-700' },
];

export interface HistoricalRecord {
  id: string;
  memberName: string;
  memberId: string;
  teamId: string;
  role: string;
  period: string;
  overallGrade: 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C';
  score: number;
  highlightKpis: string[];
  comments: string;
}

export const HR_MOCK_LOGS = [
  { id: 'l1', timestamp: '2026-05-26 10:30:00', user: '王大明 (HR 管理員)', action: '發佈考核結果', resource: '2025 第一季度績效考核', ip: '192.168.1.101', type: 'system' },
  { id: 'l2', timestamp: '2026-05-25 15:45:22', user: '林佳龍 (管理職)', action: '修改評分', resource: '陳大文的 KPI (優化核心產品)', ip: '192.168.1.105', type: 'evaluation' },
  { id: 'l3', timestamp: '2026-05-24 09:12:05', user: '陳大文 (員工)', action: '提交申覆', resource: '2025 第二期績效考核申覆單', ip: '192.168.1.132', type: 'dispute' },
  { id: 'l4', timestamp: '2026-05-23 16:20:10', user: '王大明 (HR 管理員)', action: '建立考核表', resource: '技術部 2026 評量表', ip: '192.168.1.101', type: 'template' },
  { id: 'l5', timestamp: '2026-05-22 11:05:40', user: '系統自動排程', action: '考核週期結束', resource: '2025 第二季度績效考核', ip: '127.0.0.1', type: 'system' },
  { id: 'l6', timestamp: '2026-05-21 14:33:12', user: '林佳龍 (管理職)', action: '審核通過', resource: '林小明的新進 KPI', ip: '192.168.1.105', type: 'goal' },
  { id: 'l7', timestamp: '2026-05-20 10:15:30', user: '王大明 (HR 管理員)', action: '匯出資料', resource: '2025年度全公司考核總表', ip: '192.168.1.101', type: 'system' }
];

export const HR_REVIEW_CYCLES_MOCK = [
  { 
    id: 'c1', 
    name: '2025 第二季度績效考核', 
    status: '待發佈', 
    totalEmployees: 152, 
    completedReviews: 152, 
    publishDate: '-',
    gradeDistribution: { 'A': 15, 'A-': 30, 'B+': 45, 'B': 40, 'B-': 15, 'C': 7 }
  },
  { 
    id: 'c2', 
    name: '2025 第一季度績效考核', 
    status: '已發佈', 
    totalEmployees: 145, 
    completedReviews: 145, 
    publishDate: '2026-04-05',
    gradeDistribution: { 'A': 12, 'A-': 28, 'B+': 50, 'B': 35, 'B-': 14, 'C': 6 }
  },
];

export const HR_REVIEW_CYCLES = [
  {
    id: 1,
    title: '2024 年度績效考核',
    status: '進行中',
    type: '年度考核',
    duration: '執行期間: 2024.01.01 - 2024.12.31',
    statusColor: 'bg-emerald-100 text-emerald-700',
    action1: '查看詳情',
  },
  {
    id: 2,
    title: '2023 第四季度考核',
    status: '已結束',
    type: '季度考核',
    duration: '執行期間: 2023.10.01 - 2023.12.31',
    statusColor: 'bg-slate-100 text-slate-700',
    action1: '查看詳情',
  },
  {
    id: 3,
    title: '2024 研發部專案考核',
    status: '草稿',
    type: '專案考核',
    duration: '預計期間: 2024.06.01 - 2024.06.30',
    statusColor: 'bg-indigo-100 text-indigo-700',
    action1: '查看詳情',
  },
  {
    id: 4,
    title: '2024 新進員工試用期考核',
    status: '即將開始',
    type: '試用期考核',
    duration: '執行期間: 2024.03.15 - 2024.04.15',
    statusColor: 'bg-orange-100 text-orange-700',
    action1: '查看詳情',
  }
];

export const HR_CREATE_TEMPLATE_QUESTIONNAIRES = [
  '2024 年度員工滿意度調查',
  '管理層領導力 360 度回饋',
  '新進員工試用期回饋',
  'Q3 季度開發技能評估表'
];

export const HR_CREATE_TEMPLATE_STEPS = [
  { title: '基本資料' },
  { title: '指派問卷' },
  { title: '確認發布' }
];

export const HR_QUESTIONNAIRE_TEMPLATES = [
  {
    id: 1,
    title: '2024 年度員工滿意度調查',
    category: '核心文化',
    questionCount: 15,
    lastUpdated: '2023-12-15'
  },
  {
    id: 2,
    title: '管理層領導力 360 度回饋',
    category: '管理層領導力',
    questionCount: 24,
    lastUpdated: '2024-01-10'
  },
  {
    id: 3,
    title: '新進員工試用期回饋',
    category: '團隊協作',
    questionCount: 10,
    lastUpdated: '2024-05-20'
  },
  {
    id: 4,
    title: 'Q3 季度開發技能評估表',
    category: '專業技能',
    questionCount: 12,
    lastUpdated: '2024-07-01'
  }
];

import { FileText, TrendingUp, ShieldCheck, UserCog } from 'lucide-react';

export const HR_REVIEW_TEMPLATES = [
  {
    id: 1,
    title: '2023年度績效考核範本',
    target: '全體員工',
    cycle: '2023 年度考核',
    lastUpdated: '2023-10-15',
    icon: FileText,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50'
  },
  {
    id: 2,
    title: '業務部季度目標設定 (OKR)',
    target: '業務部門',
    cycle: '2023 第四季度考核',
    lastUpdated: '2023-11-02',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50'
  },
  {
    id: 3,
    title: '新進員工試用期評估範本',
    target: '新進人員',
    cycle: '2023 十月新進人員試用',
    lastUpdated: '2023-11-10',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50'
  },
  {
    id: 4,
    title: '管理層領導力 360 度反饋',
    target: 'Manager 以上級別',
    cycle: '2023 高階管理階層評鑑',
    lastUpdated: '2023-12-01',
    icon: UserCog,
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100'
  }
];

export const EMPLOYEE_DISPUTE_MOCK = {
  submitText: "關於 2023 Q4 季度績效評核中「專案進度管理」一項被評為「尚可」，我希望能提出異議。在 Q4 期間，我所負責的 Alpha 專案雖然經歷兩次規格異動，但最終仍於 12/20 完成交付，且客戶滿意度達 4.8/5.0。主管評核中提到的進度落後情況，實際上是為確保品質而與技術部門達成共識後的時程調整...",
  listDetails: {
    period: "2023 年度 Q3 績效考核",
    description: "本人對於 Q3 考核中「專案領導力」項目的評分（B-）持有異議。 在「Project Phoenix」期間，我成功帶領 5 人跨部門團隊，提前 2 週完成了系統上線，且客戶滿意度得分為 4.8/5.0。 然而考核反饋中提到溝通效率不足，這與專案成功的實際數據與客戶反饋存在落差。 隨附的文件中包含了客戶感謝函以及專案時程紀錄，請相關單位予以核對與重新評估。",
    id: "DP-20231225-004",
    date: "2023-12-25 09:42",
    handler: "HR 部門 - 陳美玲 (Lin Chen)",
    comments: "系統提示： 您的異議申請已進入人力資源部初步審查。目前正聯繫您的直屬主管就「專案時程調整」的部分進行查證。預計將於 3 個工作日內提供進一步反饋。若有需要補充的會議紀錄或對話截圖，請利用上方的上傳功能進行更新。"
  }
};

export const EMPLOYEE_PROFILE_MOCK = {
  name: '陳大文',
  englishName: 'David Chen',
  id: '#PP-88293',
  title: '資深軟體工程師',
  department: '技術研發部',
  location: '台北總部',
  email: 'david.chen@performanceplus.com',
  avatar: 'https://i.pravatar.cc/250?img=47',
  currentReview: {
    status: '進行中',
    name: '2024 Q3 年度績效考核',
    period: '2024-1~2024-12'
  }
};

export const HR_REVIEW_CYCLE_DETAIL_MOCK = {
  name: '2024 年度年度績效考核',
  type: '年度考核',
  status: '進行中',
  periodRange: '2024/01/01 - 2024/12/31',
  managerEvalPeriod: '2025/01/01 - 2025/01/15',
  objectionPeriod: '2025/01/16 - 2025/01/20',
  announcementDate: '2025/01/31',
  stats: {
    totalEmployees: 1250,
    completedReviews: 850,
    pendingReviews: 400
  }
};

export const HR_QUESTIONNAIRE_QUESTIONS_MOCK = [
    {
      id: 1,
      content: '您對目前的工作環境是否感到滿意？',
      type: 'Rating Scale',
      scale: '1 - 5',
      mandatory: true
    },
    {
      id: 2,
      content: '您認為主管提供的反饋對您的職業成長是否有幫助？',
      type: 'Rating Scale',
      scale: '1 - 5',
      mandatory: true
    },
    {
      id: 3,
      content: '請描述您在過去一季中遇到最大的工作挑戰。',
      type: 'Text',
      limit: '500 Max',
      mandatory: false
    },
    {
      id: 4,
      content: '您認為公司在跨部門協作方面做得如何？',
      type: 'Rating Scale',
      scale: '1 - 10',
      mandatory: true
    },
    {
      id: 5,
      content: '您最喜歡公司目前哪一項福利政策？',
      type: 'Multiple Choice',
      options: '6 Options',
      mandatory: true
    }
  ];

export const HISTORICAL_DB: HistoricalRecord[] = [
  {
    id: 'h1',
    memberName: '陳大文',
    memberId: 'm1',
    teamId: 'tech-a',
    role: '資深軟體工程師',
    period: '2025 第二季度考核',
    overallGrade: 'A',
    score: 95,
    highlightKpis: ['雲端伺服器遷移節省 30% 支出', '主產品載入速度優化 45%'],
    comments: '大文在本期表現極其優異，展現出高水準的架構設計能力，且自動化測試推廣十分順利，是團隊的技術核心。'
  },
  {
    id: 'h2',
    memberName: '林小明',
    memberId: 'm2',
    teamId: 'tech-a',
    role: '網頁工程師',
    period: '2025 第二季度考核',
    overallGrade: 'B+',
    score: 86,
    highlightKpis: ['前端元件庫重構與模組化', '新增 12 套自動化 UI 驗收管線'],
    comments: '小明在前端重構有高度熱忱，唯與產設組之協作銜接需要更主動。此期評分已校正並予以認可。'
  },
  {
    id: 'h3',
    memberName: '張美玲',
    memberId: 'm3',
    teamId: 'tech-a',
    role: '後端工程師',
    period: '2025 第二季度考核',
    overallGrade: 'A-',
    score: 91,
    highlightKpis: ['完成讀寫分離及快取優化方案', '資料庫慢查詢率下降達 60%'],
    comments: '美玲在本季度資料庫優化工作成果顯著，為系統高併發讀寫提供了穩定的支撐，配合主架構工作成效優。'
  },
  {
    id: 'h4',
    memberName: '王小華',
    memberId: 'm4',
    teamId: 'design',
    role: 'UI/UX 設計師',
    period: '2025 第二季度考核',
    overallGrade: 'A-',
    score: 90,
    highlightKpis: ['Design System 組件規範重置 1.0 版本', '優化電商交易頁面用戶旅程'],
    comments: '小華對於設計元件系統有良好主導性。本季度因應需求異動校準後，其交付設計的高品質和高保真度仍值得給予高分。'
  },
  {
    id: 'h5',
    memberName: '趙子龍',
    memberId: 'm5',
    teamId: 'design',
    role: '視覺設計師',
    period: '2025 第二季度考核',
    overallGrade: 'B',
    score: 80,
    highlightKpis: ['形象官網 Landing Page 視覺定位與重繪', '公司年度大會視覺宣傳排版設計'],
    comments: '子龍在視覺創意上十分出色，本期順利交付了所有的官網多媒體素材。在專案進度管理及交付時程預留上可再行加強。'
  },
  {
    id: 'h6',
    memberName: '李明建',
    memberId: 'm6',
    teamId: 'marketing',
    role: '社群行銷專員',
    period: '2025 第二季度考核',
    overallGrade: 'B+',
    score: 85,
    highlightKpis: ['官方社群粉絲突破 100K 追蹤', '第二季行銷節慶流量提升 42%'],
    comments: '明建社群掌握節奏優秀，本季度行銷操作帶動大量自然流量，轉化效果亦良好。'
  },
  {
    id: 'h7',
    memberName: '蔡美美',
    memberId: 'm7',
    teamId: 'marketing',
    role: '廣告投放專員',
    period: '2025 第二季度考核',
    overallGrade: 'B',
    score: 82,
    highlightKpis: ['高負載下 ROI 持穩於 $9.8 以上', '多版 A/B 廣告投放定位微詞測試'],
    comments: '雖然受市場大環境影響，競價成本大幅提高，但投放控制依然合乎規程。經考核校準調整為 B 等級。'
  },
  {
    id: 'h8',
    memberName: '陳大文',
    memberId: 'm1',
    teamId: 'tech-a',
    role: '資深軟體工程師',
    period: '2025 第一季度考核',
    overallGrade: 'A',
    score: 94,
    highlightKpis: ['解決舊版高併發死鎖 (Deadlock)', '重編內部 CI/CD 動態資源部署'],
    comments: '一季度工作繁重，大文不僅完成架構重整，更積極指導新人，帶動團隊整體向上。'
  },
  {
    id: 'h9',
    memberName: '林小明',
    memberId: 'm2',
    teamId: 'tech-a',
    role: '網頁工程師',
    period: '2025 第一季度考核',
    overallGrade: 'B',
    score: 79,
    highlightKpis: ['形象系統響應式介面調整', '處理舊產品瀏覽器相容性調適錄'],
    comments: '日常維護工作確實，但新技術的探索進展較為緩慢，期待能在之後季度展現積極度。'
  }
];
