import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPerformanceCycle,
  listPerformanceCycles,
  updatePerformanceCycleStatus,
  type Fetcher,
} from '../src/api/hr';
import CreateReviewCycle from '../src/features/hr/review-cycles/pages/CreateReviewCycle';
import ReviewCycleDetail from '../src/features/hr/review-cycles/pages/ReviewCycleDetail';
import ReviewCycles from '../src/features/hr/review-cycles/pages/ReviewCycles';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

const cyclePayload = {
  id: 'cycle-2027',
  name: '2027 年度績效考核',
  cycle_type: 'annual',
  status: 'not_started',
  timezone: 'Asia/Taipei',
  manager_eval_start: '2027-01-16T00:00:00+08:00',
  manager_eval_end: '2027-01-31T23:59:59+08:00',
  hr_review_end: '2027-02-07T23:59:59+08:00',
  appeal_deadline_days: 7,
  is_locked: false,
  created_by: 'hr-user',
  created_at: '2026-12-01T08:00:00+08:00',
  updated_at: '2026-12-01T08:00:00+08:00',
};

const cycleListPayload = {
  data: [cyclePayload],
  meta: {
    current_page: 1,
    total_pages: 1,
    total_count: 1,
  },
};

describe('HR performance cycle API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('lists cycles with backend pagination query and stored JWT', async () => {
    const fetcher = vi.fn(async () => jsonResponse(cycleListPayload)) satisfies Fetcher;
    localStorage.setItem('token', 'hr-dev-token');

    await expect(listPerformanceCycles({ page: 1, page_size: 10 }, { fetcher })).resolves.toEqual(
      cycleListPayload,
    );

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles?page=1&page_size=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer hr-dev-token',
        }),
      }),
    );
  });

  it('creates cycles with backend-shaped manager and HR review fields', async () => {
    const fetcher = vi.fn(async () => jsonResponse(cyclePayload, { status: 201 })) satisfies Fetcher;

    await createPerformanceCycle(
      {
        name: '2027 年度績效考核',
        cycle_type: 'annual',
        timezone: 'Asia/Taipei',
        manager_eval_start: '2027-01-16T00:00:00+08:00',
        manager_eval_end: '2027-01-31T23:59:59+08:00',
        hr_review_end: '2027-02-07T23:59:59+08:00',
        appeal_deadline_days: 7,
      },
      { fetcher, authToken: 'raw-token' },
    );

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer raw-token',
        }),
        body: JSON.stringify({
          name: '2027 年度績效考核',
          cycle_type: 'annual',
          timezone: 'Asia/Taipei',
          manager_eval_start: '2027-01-16T00:00:00+08:00',
          manager_eval_end: '2027-01-31T23:59:59+08:00',
          hr_review_end: '2027-02-07T23:59:59+08:00',
          appeal_deadline_days: 7,
        }),
      }),
    );
  });

  it('updates cycle status through the backend status endpoint', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...cyclePayload,
        status: 'in_progress',
      }),
    ) satisfies Fetcher;

    await updatePerformanceCycleStatus('cycle-2027', 'in_progress', { fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles/cycle-2027/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
    );
  });
});

describe('HR performance cycle pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders the cycle list from the backend API', async () => {
    const fetcher = vi.fn(async () => jsonResponse(cycleListPayload));
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'hr-dev-token');

    render(
      <MemoryRouter initialEntries={['/hr/cycles']}>
        <ReviewCycles />
      </MemoryRouter>,
    );

    expect(await screen.findByText('2027 年度績效考核')).toBeInTheDocument();
    expect(screen.getAllByText('尚未開始')).toHaveLength(2);
    expect(screen.queryByText('2024 年度績效考核')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles?page=1&page_size=10',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer hr-dev-token',
        }),
      }),
    );
  });

  it('creates a cycle from the form and navigates to detail', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);

      if (path === '/api/v1/hr/performance-cycles' && init?.method === 'POST') {
        return jsonResponse(cyclePayload, { status: 201 });
      }

      return jsonResponse({ error: { code: 'NOT_FOUND', message: path } }, { status: 404 });
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/cycles/new']}>
        <Routes>
          <Route path="/hr/cycles/new" element={<CreateReviewCycle />} />
          <Route path="/hr/cycles/:id" element={<div>建立完成</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('考核週期名稱'), {
      target: { value: '2027 年度績效考核' },
    });
    fireEvent.change(screen.getByLabelText('主管評核開始日'), {
      target: { value: '2027-01-16' },
    });
    fireEvent.change(screen.getByLabelText('主管評核結束日'), {
      target: { value: '2027-01-31' },
    });
    fireEvent.change(screen.getByLabelText('HR 覆核截止日'), {
      target: { value: '2027-02-07' },
    });
    fireEvent.click(screen.getByRole('button', { name: '建立' }));
    fireEvent.click(screen.getByRole('button', { name: '確定建立' }));

    expect(await screen.findByText('建立完成')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        '/api/v1/hr/performance-cycles',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: '2027 年度績效考核',
            cycle_type: 'annual',
            timezone: 'Asia/Taipei',
            manager_eval_start: '2027-01-16T00:00:00+08:00',
            manager_eval_end: '2027-01-31T23:59:59+08:00',
            hr_review_end: '2027-02-07T23:59:59+08:00',
            appeal_deadline_days: 7,
          }),
        }),
      );
    });
  });

  it('loads cycle detail, updates settings, and advances status', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);

      if (path === '/api/v1/hr/performance-cycles/cycle-2027' && init?.method === 'PATCH') {
        return jsonResponse({
          ...cyclePayload,
          name: '2027 年度績效考核 修正版',
          manager_eval_end: '2027-02-02T23:59:59+08:00',
        });
      }

      if (path === '/api/v1/hr/performance-cycles/cycle-2027/status' && init?.method === 'PATCH') {
        return jsonResponse({
          ...cyclePayload,
          status: 'in_progress',
        });
      }

      return jsonResponse(cyclePayload);
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/cycles/cycle-2027']}>
        <Routes>
          <Route path="/hr/cycles/:id" element={<ReviewCycleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('2027 年度績效考核')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '編輯設定' }));
    fireEvent.change(screen.getByLabelText('考核週期名稱'), {
      target: { value: '2027 年度績效考核 修正版' },
    });
    fireEvent.change(screen.getByLabelText('主管評核結束日'), {
      target: { value: '2027-02-02' },
    });
    fireEvent.click(screen.getByRole('button', { name: '儲存設定' }));

    expect(await screen.findByText('2027 年度績效考核 修正版')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles/cycle-2027',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          name: '2027 年度績效考核 修正版',
          timezone: 'Asia/Taipei',
          manager_eval_start: '2027-01-16T00:00:00+08:00',
          manager_eval_end: '2027-02-02T23:59:59+08:00',
          hr_review_end: '2027-02-07T23:59:59+08:00',
          appeal_deadline_days: 7,
        }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '轉為進行中' }));

    expect(await screen.findByText('進行中')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/performance-cycles/cycle-2027/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
    );
  });
});
