import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewGoal from '../src/features/goals/pages/NewGoal';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

function renderNewGoal() {
  render(
    <MemoryRouter initialEntries={['/goals/new']}>
      <Routes>
        <Route path="/goals/new" element={<NewGoal />} />
        <Route path="/goals/current" element={<div>本期目標列表</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NewGoal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('posts a new goal to the backend and returns to current goals', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        goal: {
          goal_id: 'goal_002',
          cycle_id: 'cycle_2024_q3',
          goal_type: 'individual',
          title: '提升產品技術文件完整度',
          description: '補齊核心模組 API 文件。',
          due_date: '2024-09-30',
          status: 'pending_review',
          progress_percent: 0,
          available_actions: {
            can_edit: false,
            can_update_progress: false,
          },
        },
      }, { status: 201 }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    renderNewGoal();

    fireEvent.change(screen.getByPlaceholderText('例如：提升產品技術文件完整度'), {
      target: { value: '提升產品技術文件完整度' },
    });
    fireEvent.change(screen.getByLabelText(/預計達成時間/), {
      target: { value: '2024-09-30' },
    });
    fireEvent.change(screen.getByPlaceholderText('詳細描述此目標的背景、執行方式與預期價值...'), {
      target: { value: '補齊核心模組 API 文件。' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提交並送審' }));
    fireEvent.click(screen.getByRole('button', { name: '確認提交' }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
        body: JSON.stringify({
          title: '提升產品技術文件完整度',
          due_date: '2024-09-30',
          description: '補齊核心模組 API 文件。',
        }),
      }),
    ));
    expect(await screen.findByText('本期目標列表')).toBeInTheDocument();
  });

  it('does not open the confirmation modal when required fields are missing', () => {
    renderNewGoal();

    fireEvent.click(screen.getByRole('button', { name: '提交並送審' }));

    expect(screen.getByText('請填寫目標名稱、截止日期與目標說明。')).toBeInTheDocument();
    expect(screen.queryByText('確認提交目標審核')).not.toBeInTheDocument();
  });
});
