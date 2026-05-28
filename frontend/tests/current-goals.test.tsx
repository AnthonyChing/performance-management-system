import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentGoals, {
  CurrentGoalsContent,
} from '../src/features/goals/pages/CurrentGoals';
import type { EmployeeGoal } from '../src/api/employee';

const goals: EmployeeGoal[] = [
  {
    goal_id: 'goal_001',
    cycle_id: 'cycle_2024_q3',
    goal_type: 'individual',
    title: '完成推薦系統重構',
    description: '完成核心服務拆分與壓測。',
    due_date: '2024-09-15',
    status: 'in_progress',
    progress_percent: 60,
    latest_progress_update: {
      progress_update_id: 'progress_001',
      progress_percent: 60,
      note: '已完成 API 拆分。',
    },
  },
  {
    goal_id: 'goal_002',
    title: '整理資料平台告警規則',
    due_date: '2024-09-20',
    status: 'pending_review',
    progress_percent: 100,
  },
];

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

describe('CurrentGoals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads current goals from the backend API path', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
          period_label: '2024-07-01~2024-09-30',
        },
        available_actions: {
          can_create_goal: true,
        },
        summary: {
          total_count: 2,
        },
        goals,
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/goals/current']}>
        <CurrentGoals />
      </MemoryRouter>,
    );

    expect(await screen.findByText('完成推薦系統重構')).toBeInTheDocument();
    expect(screen.getByText('2024-07-01~2024-09-30')).toBeInTheDocument();
    expect(screen.getByText('完成核心服務拆分與壓測。')).toBeInTheDocument();
    expect(screen.getByText('進行中')).toBeInTheDocument();
    expect(screen.getByText('待審核')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.queryByText('雲端架構遷移專案')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );
  });

  it('renders loading, empty, and error states without mock rows', () => {
    const { rerender } = render(
      <MemoryRouter>
        <CurrentGoalsContent isLoading errorMessage={null} goals={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('載入本期目標中...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CurrentGoalsContent isLoading={false} errorMessage={null} goals={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('目前尚未建立本期目標。')).toBeInTheDocument();
    expect(screen.queryByText('雲端架構遷移專案')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CurrentGoalsContent
          isLoading={false}
          errorMessage="No current performance cycle found"
          goals={[]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('No current performance cycle found')).toBeInTheDocument();
  });

  it('renders backend-shaped current goals', () => {
    render(
      <MemoryRouter>
        <CurrentGoalsContent isLoading={false} errorMessage={null} goals={goals} />
      </MemoryRouter>,
    );

    expect(screen.getByText('完成推薦系統重構')).toBeInTheDocument();
    expect(screen.getByText('截止日期：2024-09-15')).toBeInTheDocument();
    expect(screen.getByText('整理資料平台告警規則')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /查看詳情/i })[0]).toHaveAttribute(
      'href',
      '/goals/goal_001',
    );
  });
});
