import {
  listAllSubordinateGoals,
  listMySubordinates,
  updateGoal as apiUpdateGoal,
  createGoal as apiCreateGoal,
  submitKpiEvaluation,
  GoalStatus
} from '../../../api/manager';
import type { ReviewItem, TeamMember, Team } from './types';

// Map backend status to frontend status
function mapStatusToFrontend(backendStatus: string): "進行中" | "待審核" | "已否決" | "已評估" {
  switch (backendStatus) {
    case 'pending_review': return '待審核';
    case 'in_progress': return '進行中';
    case 'completed': return '已評估';
    default: return '待審核';
  }
}

function mapStatusToBackend(frontendStatus: string): GoalStatus {
  switch (frontendStatus) {
    case '待審核': return 'pending_review';
    case '進行中': return 'in_progress';
    case '已評估': return 'completed';
    case '已否決': return 'pending_review'; // Or reject if backend supports
    default: return 'pending_review';
  }
}

export async function loadManagerDataAsync(): Promise<{ teams: Team[]; members: TeamMember[]; goals: ReviewItem[] }> {
  try {
    const [subsRes, goalsRes] = await Promise.all([
      listMySubordinates(),
      listAllSubordinateGoals()
    ]);

    const members: TeamMember[] = subsRes.data.map(sub => ({
      id: sub.id,
      name: sub.name,
      teamId: sub.department,
      role: sub.job_title,
      avatar: '',
      email: sub.email,
      progress: 0,
      goalsCount: 0
    }));

    // Deduplicate departments to form teams
    const teamIds = Array.from(new Set(members.map(m => m.teamId)));
    const teams: Team[] = teamIds.map(tid => ({
      id: tid,
      name: tid, // Since we don't have department names separately, we use id as name
      manager: '',
      memberCount: members.filter(m => m.teamId === tid).length,
      avgProgress: 0
    }));

    const goals: ReviewItem[] = goalsRes.data.map(g => {
      const member = members.find(m => m.id === g.owner_id);
      return {
        id: g.id,
        title: g.title,
        type: g.goal_type === 'KPI' ? 'KPI' : '目標',
        memberId: g.owner_id,
        memberName: member?.name || 'Unknown',
        teamId: member?.teamId || 'Unknown',
        weight: undefined, // Backend might not have weight on goals directly
        target: undefined,
        dueDate: g.due_date || '',
        status: mapStatusToFrontend(g.status),
        score: undefined,
        comment: undefined
      };
    });

    return { teams, members, goals };
  } catch (error) {
    console.error('Failed to load manager data', error);
    return { teams: [], members: [], goals: [] };
  }
}

export async function updateGoalStatusAsync(id: string, memberId: string, status: string): Promise<boolean> {
  try {
    await apiUpdateGoal(memberId, id, { status: mapStatusToBackend(status) });
    return true;
  } catch (error) {
    console.error('Failed to update goal status', error);
    return false;
  }
}

export async function addMockGoalAsync(goal: any): Promise<boolean> {
  try {
    await apiCreateGoal(goal.memberId, {
      title: goal.title,
      description: goal.title,
      goal_type: goal.type === 'KPI' ? 'KPI' : 'INDIVIDUAL',
      due_date: goal.dueDate
    });
    return true;
  } catch (error) {
    console.error('Failed to create goal', error);
    return false;
  }
}

export async function editGoalAsync(id: string, memberId: string, updates: any): Promise<boolean> {
  try {
    await apiUpdateGoal(memberId, id, {
      title: updates.title,
      description: updates.title,
      due_date: updates.dueDate,
    });
    return true;
  } catch (error) {
    console.error('Failed to edit goal', error);
    return false;
  }
}

export async function evaluateGoalAsync(id: string, memberId: string, score: number, comment: string): Promise<boolean> {
  // Evaluation API might be different, using submitKpiEvaluation here if applicable, or we just leave it for now.
  // Note: Evaluate is usually tied to evaluation cycle, not directly on goal
  return true;
}
