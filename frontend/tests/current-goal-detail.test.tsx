import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoalDetail from '../src/features/goals/pages/GoalDetail';

const goal = {
  goal_id: 'goal_001',
  cycle_id: 'cycle_2024_q3',
  goal_type: 'individual',
  title: '完成推薦系統重構',
  description: '完成核心服務拆分與壓測。',
  due_date: '2024-09-15',
  status: 'in_progress',
  progress_percent: 60,
  reviewer: {
    user_id: 'user_manager_001',
    name: '林美玲',
    title: 'Engineering Manager',
  },
  latest_progress_update: {
    progress_update_id: 'progress_001',
    progress_percent: 60,
    note: '已完成 API 拆分。',
    created_at: '2024-08-10T09:30:00+08:00',
  },
  latest_review: {
    review_id: 'review_001',
    decision: 'approved',
    comment: '方向正確，請持續補上壓測數據。',
    reviewed_at: '2024-08-11T10:00:00+08:00',
    reviewer: {
      user_id: 'user_manager_001',
      name: '林美玲',
      title: 'Engineering Manager',
    },
  },
  available_actions: {
    can_edit: false,
    can_update_progress: true,
  },
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

function renderGoalDetail(path = '/goals/goal_001') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/goals/:id" element={<GoalDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GoalDetail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads goal detail from current goals API instead of hardcoded mock content', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
        },
        goals: [goal],
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    renderGoalDetail();

    expect(await screen.findByRole('heading', { name: '完成推薦系統重構' }))
      .toBeInTheDocument();
    expect(screen.getByText('完成核心服務拆分與壓測。')).toBeInTheDocument();
    expect(screen.getByText('截止日期： 2024-09-15')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('已完成 API 拆分。')).toBeInTheDocument();
    expect(screen.getByText('方向正確，請持續補上壓測數據。')).toBeInTheDocument();
    expect(screen.queryByText('提升 Q3 季度客戶滿意度至 92%')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
        }),
      }),
    );
  });

  it('posts progress updates from the detail modal', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/progress-updates')) {
        return jsonResponse({
          progress_update: {
            progress_update_id: 'progress_002',
            goal_id: 'goal_001',
            progress_percent: 80,
            note: '已完成新版客服流程試行。',
            created_at: '2024-08-20T14:30:00+08:00',
          },
          goal: {
            goal_id: 'goal_001',
            progress_percent: 80,
            latest_progress_update: {
              progress_update_id: 'progress_002',
              progress_percent: 80,
              note: '已完成新版客服流程試行。',
              created_at: '2024-08-20T14:30:00+08:00',
            },
            available_actions: {
              can_update_progress: true,
            },
          },
        }, { status: 201 });
      }

      return jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
        },
        goals: [goal],
      });
    });
    vi.stubGlobal('fetch', fetcher);

    renderGoalDetail();

    fireEvent.click(await screen.findByRole('button', { name: '更新進度' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '80' } });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '已完成新版客服流程試行。' },
    });
    fireEvent.click(screen.getByRole('button', { name: '確認更新' }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals/goal_001/progress-updates',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          progress_percent: 80,
          note: '已完成新版客服流程試行。',
        }),
      }),
    ));
    expect(await screen.findByText('已完成新版客服流程試行。')).toBeInTheDocument();
  });

  it('renders a not found state when the goal id is not in current goals', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
        },
        goals: [goal],
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    renderGoalDetail('/goals/missing_goal');

    expect(await screen.findByText('找不到此目標。')).toBeInTheDocument();
  });
});
