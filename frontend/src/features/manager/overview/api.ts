import { listMySubordinates, listAllSubordinateGoals, listAppeals } from '../../../api/manager';
import type { Team, TeamMember, ReviewItem, DisputeItem } from './types';

export { listMySubordinates, listAllSubordinateGoals, listAppeals };

function mapDepartmentIdToName(deptId: string): string {
  const depts: Record<string, string> = {
    '00000000-0000-0000-0000-000000000011': '技術研發部',
    '00000000-0000-0000-0000-000000000111': '技術研發部 Backend組',
    '00000000-0000-0000-0000-000000000112': '技術研發部 Frontend組',
    '00000000-0000-0000-0000-000000000012': '業務行銷組',
    '00000000-0000-0000-0000-000000000013': '人資暨企業文化部'
  };
  return depts[deptId] || deptId || '直屬部門';
}

function mapGoalStatusToFrontend(status: string): '待審核' | '進行中' | '已否決' | '已評估' {
  switch (status) {
    case 'pending_review': return '待審核';
    case 'in_progress': return '進行中';
    case 'completed': return '已評估';
    case 'cancelled': return '已否決';
    default: return '進行中';
  }
}

export async function loadManagerOverviewDataAsync(): Promise<{
  teams: Team[];
  members: TeamMember[];
  goals: ReviewItem[];
  disputes: DisputeItem[];
}> {
  try {
    const [subsRes, goalsRes] = await Promise.all([
      listMySubordinates(),
      listAllSubordinateGoals()
    ]);

    const subordinates = subsRes.data;
    const allGoals = goalsRes.data;

    // 1. Map Members
    const members: TeamMember[] = subordinates.map(sub => {
      const subGoals = allGoals.filter(g => g.owner_id === sub.id);
      const progress = subGoals.length > 0
        ? Math.round(subGoals.reduce((sum, g) => sum + g.progress_percent, 0) / subGoals.length)
        : 0;

      return {
        id: sub.id,
        teamId: sub.department || 'General',
        name: sub.name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&background=random`,
        role: sub.job_title || '員工',
        email: sub.email || '',
        progress,
        goalsCount: subGoals.length
      };
    });

    // 2. Map Teams
    const teamIds = Array.from(new Set(subordinates.map(sub => sub.department || 'General')));
    const teams: Team[] = teamIds.map(tid => {
      const teamMembers = members.filter(m => m.teamId === tid);
      const avgProgress = teamMembers.length > 0
        ? Math.round(teamMembers.reduce((sum, m) => sum + m.progress, 0) / teamMembers.length)
        : 0;

      return {
        id: tid,
        name: mapDepartmentIdToName(tid),
        manager: '您',
        memberCount: teamMembers.length,
        avgProgress
      };
    });

    // 3. Map Goals/KPIs
    const goals: ReviewItem[] = allGoals.map(g => {
      const owner = subordinates.find(s => s.id === g.owner_id);
      return {
        id: g.id,
        memberId: g.owner_id,
        memberName: owner?.name || '未知同仁',
        teamId: owner?.department || 'General',
        title: g.title,
        type: g.goal_type === 'KPI' ? 'KPI' : '目標',
        status: mapGoalStatusToFrontend(g.status),
        dueDate: g.due_date || '',
        progressPercent: g.progress_percent
      };
    });

    // 4. Map Disputes (Appeals) from all unique teams
    const disputePromises = teamIds.map(async (tid) => {
      if (tid === 'General') return [];
      try {
        const appealRes = await listAppeals(tid);
        return appealRes.data;
      } catch (err) {
        console.error(`Failed to list appeals for team ${tid}`, err);
        return [];
      }
    });

    const allAppealsNested = await Promise.all(disputePromises);
    const allAppeals = allAppealsNested.flat();

    const disputes: DisputeItem[] = allAppeals.map(a => {
      const disputeStatus = a.status === 'submitted' || a.status === 'under_review' || a.status === 'need_more_info'
        ? '待處理'
        : a.status === 'approved'
        ? '已同意'
        : '已駁回';

      return {
        id: a.id,
        memberId: a.filed_by,
        memberName: a.filed_by_name || '未知同仁',
        teamId: subordinates.find(s => s.id === a.filed_by)?.department || 'General',
        period: '目前考核週期',
        kpiName: a.reason,
        originalScore: 0,
        requestedScore: 0,
        reason: a.reason,
        status: disputeStatus,
        createdAt: a.filed_at ? new Date(a.filed_at).toLocaleDateString('zh-TW') : '未提供日期'
      };
    });

    return { teams, members, goals, disputes };
  } catch (error) {
    console.error('Failed to load manager overview data', error);
    return { teams: [], members: [], goals: [], disputes: [] };
  }
}
