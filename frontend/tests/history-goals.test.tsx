import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryGoalDetail from '../src/features/goals/pages/HistoryGoalDetail';
import HistoryGoals, {
  HistoryGoalsContent,
} from '../src/features/goals/pages/HistoryGoals';
import PeriodHistoryGoals, {
  PeriodHistoryGoalsContent,
} from '../src/features/goals/pages/PeriodHistoryGoals';
import type {
  EmployeeGoal,
  EmployeePagination,
  GoalCycleSummary,
  GoalSummary,
} from '../src/api/employee';

const pagination: EmployeePagination = {
  page: 1,
  page_size: 10,
  total_pages: 1,
  total_count: 1,
  has_previous: false,
  has_next: false,
};

const cycle: GoalCycleSummary = {
  cycle_id: 'cycle_2025_annual',
  name: '2025年度考核',
  period_label: '2025 年度',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  timezone: 'Asia/Taipei',
  status: 'completed',
  average_completion_percent: 75,
  goal_count: 1,
};

const goal: EmployeeGoal = {
  goal_id: 'goal_h_001',
  cycle_id: 'cycle_2025_annual',
  goal_type: 'individual',
  title: '雲端架構遷移專案',
  description: '完成核心服務雲端遷移與部署流程優化。',
  due_date: '2025-10-14',
  status: 'completed',
  progress_percent: 75,
  latest_progress_update: {
    progress_update_id: 'progress_h_001',
    progress_percent: 75,
    note: '核心服務已完成遷移，後續進行監控與效能調校。',
    created_at: '2025-10-14T16:20:00+08:00',
  },
  latest_review: {
    review_id: 'goal_review_h_001',
    decision: 'approved',
    comment: '完成主要遷移工作，請持續追蹤穩定性與成本指標。',
    reviewed_at: '2025-10-20T11:00:00+08:00',
    reviewer: {
      user_id: 'user_100',
      name: '李曉芳',
      title: 'Director',
    },
  },
};

const summary: GoalSummary = {
  average_completion_percent: 75,
  goal_count: 1,
  completed_count: 1,
  cancelled_count: 0,
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

describe('employee historical goals pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads historical cycles from the backend API path', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        mode: 'historical_cycles',
        pagination,
        historical_cycles: [cycle],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/goals/history']}>
        <HistoryGoals />
      </MemoryRouter>,
    );

    expect(await screen.findByText('2025年度考核')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01 至 2025-12-31')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /查看詳情/i })).toHaveAttribute(
      'href',
      '/goals/history/cycle_2025_annual',
    );
    expect(screen.queryByText('2023 第四季度 (Q4) 年度終考')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals?status=historical&page=1&page_size=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );
  });

  it('renders historical cycles loading, empty, and error states', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <HistoryGoalsContent
          isLoading
          errorMessage={null}
          cycles={[]}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('載入歷史目標中...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <HistoryGoalsContent
          isLoading={false}
          errorMessage={null}
          cycles={[]}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('目前尚無歷史目標資料。')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <HistoryGoalsContent
          isLoading={false}
          errorMessage="Cycle is not a historical cycle"
          cycles={[]}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Cycle is not a historical cycle')).toBeInTheDocument();
  });

  it('loads goals for one historical cycle from the backend', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        mode: 'historical_goals',
        cycle,
        pagination,
        summary,
        goals: [goal],
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/goals/history/cycle_2025_annual']}>
        <Routes>
          <Route path="/goals/history/:periodId" element={<PeriodHistoryGoals />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('雲端架構遷移專案')).toBeInTheDocument();
    expect(screen.getByText('完成核心服務雲端遷移與部署流程優化。')).toBeInTheDocument();
    expect(screen.getByText('截止日期：2025-10-14')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /查看詳情/i })).toHaveAttribute(
      'href',
      '/goals/history/cycle_2025_annual/goal_h_001',
    );
    expect(screen.queryByText('Q3 內部技術培訓講師')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals?status=historical&page=1&page_size=10&cycle_id=cycle_2025_annual',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('renders historical goals loading, empty, and backend-shaped rows', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <PeriodHistoryGoalsContent
          isLoading
          errorMessage={null}
          goals={[]}
          periodId="cycle_2025_annual"
          summary={null}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('載入該期歷史目標中...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PeriodHistoryGoalsContent
          isLoading={false}
          errorMessage={null}
          goals={[]}
          periodId="cycle_2025_annual"
          summary={summary}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('此考核週期尚無歷史目標。')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PeriodHistoryGoalsContent
          isLoading={false}
          errorMessage={null}
          goals={[goal]}
          periodId="cycle_2025_annual"
          summary={summary}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('雲端架構遷移專案')).toBeInTheDocument();
    expect(screen.getAllByText('已完成').length).toBeGreaterThan(0);
  });

  it('loads one historical goal detail by cycle id and goal id', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        mode: 'historical_goals',
        cycle,
        pagination,
        summary,
        goals: [goal],
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/goals/history/cycle_2025_annual/goal_h_001']}>
        <Routes>
          <Route
            path="/goals/history/:periodId/:goalId"
            element={<HistoryGoalDetail />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/雲端架構遷移專案/)).toBeInTheDocument();
    expect(screen.getByText('完成核心服務雲端遷移與部署流程優化。')).toBeInTheDocument();
    expect(screen.getByText('核心服務已完成遷移，後續進行監控與效能調校。')).toBeInTheDocument();
    expect(screen.getByText('完成主要遷移工作，請持續追蹤穩定性與成本指標。')).toBeInTheDocument();
    expect(screen.getByText('李曉芳 (Director)')).toBeInTheDocument();
    expect(screen.queryByText('提升 Q3 季度客戶滿意度至 92%')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals?status=historical&page=1&page_size=100&cycle_id=cycle_2025_annual',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
