import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Dispute from '../src/features/performance/pages/Dispute';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

const composePayload = {
  mode: 'compose',
  period: {
    cycle_id: 'cycle_2025_q3',
    name: '2025 年度 Q3 績效考核',
    period_label: '2025-07-01~2025-09-30',
    start_date: '2025-07-01',
    end_date: '2025-09-30',
  },
  appeal_period: {
    status: 'open',
    start_date: '2025-10-15',
    end_date: '2025-10-22',
    timezone: 'Asia/Taipei',
  },
  review_result: {
    review_id: 'review_2025_q3_user_001',
    final_rating: 'meets_expectations',
    kpi_score: 86.5,
    review_score: 82,
    manager_comment: '整體表現穩定，專案推進能力良好。',
  },
  current_appeal: null,
  available_actions: {
    can_start_appeal: true,
    start_appeal_unavailable_reason: null,
    can_submit: true,
    submit_unavailable_reason: null,
  },
};

const submittedAppeal = {
  appeal_id: 'appeal_20251016_004',
  case_no: 'DP-20251016-004',
  review_id: 'review_2025_q3_user_001',
  period: composePayload.period,
  reason: '本人對本期績效結果提出異議。',
  status: 'submitted',
  submitted_at: '2025-10-16T09:42:00+08:00',
  resolved_at: null,
  handler: {
    user_id: 'hr_001',
    type: 'hr',
    name: '陳美玲',
    english_name: 'Lin Chen',
    department: 'HR 部門',
  },
  processing_comment: '您的異議申請已進入人力資源部初步審查。',
  processing_comment_updated_at: '2025-10-17T15:20:00+08:00',
  is_final_response: false,
  updated_at: '2025-10-17T15:20:00+08:00',
};

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('employee performance dispute page', () => {
  it('renders the loading state before the appeal API resolves', () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/dispute']}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(screen.getByText('載入績效異議資料中...')).toBeInTheDocument();
  });

  it('renders a backend error message when appeal state cannot be loaded', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: '找不到目前登入者在本期的考核資料。',
          },
        },
        { status: 404 },
      ),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/dispute']}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(await screen.findByText('找不到目前登入者在本期的考核資料。'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: '發起異議' })).toBeDisabled();
  });

  it('renders the no-dispute state with a disabled start button when appeals are closed', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...composePayload,
        appeal_period: {
          ...composePayload.appeal_period,
          status: 'closed',
        },
        available_actions: {
          can_start_appeal: false,
          start_appeal_unavailable_reason: 'closed',
          can_submit: false,
          submit_unavailable_reason: 'closed',
        },
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/dispute']}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(await screen.findByText('目前尚未提出本期績效異議。')).toBeInTheDocument();
    expect(screen.getByText('異議期間已結束。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '發起異議' })).toBeDisabled();
  });

  it('renders the compose form with review context and validates an empty reason', async () => {
    const fetcher = vi.fn(async () => jsonResponse(composePayload));
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/dispute', state: { view: 'submit' } }]}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(await screen.findByText('2025 年度 Q3 績效考核 (2025-07-01~2025-09-30)'))
      .toBeInTheDocument();
    expect(screen.getByText('整體表現穩定，專案推進能力良好。')).toBeInTheDocument();
    expect(screen.getByText('0/2000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '提交異議申請' }));

    expect(screen.getByText('請填寫異議說明內容。')).toBeInTheDocument();
    expect(screen.queryByText('確認提交異議申請')).not.toBeInTheDocument();
  });

  it('renders an existing dispute from the backend instead of mock data', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...composePayload,
        mode: 'result',
        appeal_period: {
          ...composePayload.appeal_period,
          status: 'closed',
        },
        current_appeal: submittedAppeal,
        available_actions: {
          can_start_appeal: false,
          start_appeal_unavailable_reason: 'already_submitted',
          can_submit: false,
          submit_unavailable_reason: 'already_submitted',
        },
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/dispute']}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(await screen.findByText('DP-20251016-004')).toBeInTheDocument();
    expect(screen.getByText('本人對本期績效結果提出異議。')).toBeInTheDocument();
    expect(screen.getByText('HR 部門 - 陳美玲 (Lin Chen)')).toBeInTheDocument();
    expect(screen.queryByText(/Project Phoenix/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Alpha 專案/)).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/appeals',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );
  });

  it('renders final appeal result details and fallback text for missing handler data', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...composePayload,
        mode: 'result',
        current_appeal: {
          ...submittedAppeal,
          status: 'approved',
          handler: null,
          processing_comment: '經複核後，本次異議成立。',
          processing_comment_updated_at: '2025-10-20T15:20:00+08:00',
          is_final_response: true,
        },
        available_actions: {
          can_start_appeal: false,
          start_appeal_unavailable_reason: 'already_submitted',
          can_submit: false,
          submit_unavailable_reason: 'already_submitted',
        },
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/dispute']}>
        <Dispute />
      </MemoryRouter>,
    );

    expect(await screen.findByText('異議通過')).toBeInTheDocument();
    expect(screen.getByText('最終回覆')).toBeInTheDocument();
    expect(screen.getByText('經複核後，本次異議成立。')).toBeInTheDocument();
    expect(screen.getByText('更新時間：2025-10-20 15:20')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument();
  });

  it('submits a new dispute to POST /me/appeals/submit and shows the created case', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/me/appeals/submit')) {
        return jsonResponse(
          {
            appeal: {
              ...submittedAppeal,
              reason: JSON.parse(String(init?.body)).reason,
              processing_comment: null,
              processing_comment_updated_at: null,
            },
            available_actions: {
              can_start_appeal: false,
              start_appeal_unavailable_reason: 'already_submitted',
              can_submit: false,
              submit_unavailable_reason: 'already_submitted',
            },
          },
          { status: 201 },
        );
      }

      return jsonResponse(composePayload);
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/dispute', state: { view: 'submit' } }]}>
        <Dispute />
      </MemoryRouter>,
    );

    const reason = '主管評核未反映專案交付資料，請重新複核。';
    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: reason },
    });
    fireEvent.click(screen.getByRole('button', { name: '提交異議申請' }));
    fireEvent.click(await screen.findByRole('button', { name: '確認提交' }));

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        '/api/v1/me/appeals/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            period_id: 'cycle_2025_q3',
            reason,
          }),
        }),
      );
    });
    expect(await screen.findByText('DP-20251016-004')).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });
});
