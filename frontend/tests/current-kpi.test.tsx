import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentKPI, {
  CurrentKpiResultsContent,
  CurrentKpiStandardsContent,
} from '../src/features/performance/pages/CurrentKPI';
import type { KpiResultSummary, KpiStandard } from '../src/api/employee';

const standards: KpiStandard[] = [
  {
    kpi_id: 'kpi_core_product_quality',
    name: '核心產品開發進度',
    description: '準時完成 Q3 路線圖中的 A、B 模組。',
    weight_percent: 40,
    target: {
      operator: 'gte',
      value: 95,
      unit: 'percent',
      display_text: '通過率 >= 95%',
    },
  },
  {
    kpi_id: 'kpi_internal_workshop',
    name: '團隊技術分享',
    weight_percent: 15,
    target: {
      operator: 'gte',
      value: 2,
      unit: 'times',
    },
  },
];

const result: KpiResultSummary = {
  result_id: 'review_001',
  status: 'pending_confirmation',
  score_summary: {
    performance_score: 94.5,
    kpi_achievement_percent: 125,
    manager_review_score: 88,
  },
  weighted_score: 50,
  review_score: 88,
  final_grade: 'A',
  manager_evaluation: {
    score: 88,
    comment: '技術執行力強。',
  },
  kpi_results: [
    {
      kpi_id: 'kpi_core_product_quality',
      name: '核心產品開發進度',
      weight_percent: 40,
      actual: {
        value: 5,
        unit: 'module',
        display_text: '5',
      },
      target: {
        value: 4,
        unit: 'module',
        display_text: '4',
      },
      achievement_percent: 125,
      score: 50,
      latest_snapshot: {
        snapshot_id: 'snapshot_001',
        value: 5,
        note: 'Q3 已完成 5 個模組並完成驗收。',
      },
    },
  ],
  available_actions: {
    can_confirm: true,
    can_dispute: false,
    dispute_unavailable_reason: 'not_open',
  },
  dispute_period: {
    status: 'not_open',
    start_date: '2025-10-16',
    end_date: '2025-10-20',
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

describe('CurrentKpiStandardsContent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads current KPI standards from the backend API path', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/me/kpis/result')) {
        return jsonResponse({ result });
      }

      return jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 年度 Q3 績效指標與評估',
          period_label: '2024-07-01~2024-09-30',
        },
        employee: {
          user_id: 'user_001',
          name: '陳大文',
        },
        standards,
      });
    });
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/performance/current']}>
        <CurrentKPI />
      </MemoryRouter>,
    );

    expect(await screen.findByText('核心產品開發進度')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2024 年度 Q3 績效指標與評估' }))
      .toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/standards',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/result',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '考核結果' }));
    expect(await screen.findByText('94.5')).toBeInTheDocument();
  });

  it('renders empty KPI states when the current KPI cycle is missing', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        error: {
          code: 'CURRENT_KPI_CYCLE_NOT_FOUND',
          message: 'No current KPI cycle found',
        },
      }, { status: 404 }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/performance/current']}>
        <CurrentKPI />
      </MemoryRouter>,
    );

    expect(await screen.findByText('目前尚未設定 KPI 標準。')).toBeInTheDocument();
    expect(screen.queryByText('No current KPI cycle found')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '考核結果' }));
    expect(await screen.findByText('目前沒有可顯示的 KPI 考核結果。')).toBeInTheDocument();
    expect(screen.queryByText('No current KPI cycle found')).not.toBeInTheDocument();
  });

  it('renders KPI standards from backend-shaped data', () => {
    render(
      <CurrentKpiStandardsContent
        isLoading={false}
        errorMessage={null}
        standards={standards}
      />,
    );

    expect(screen.getByText('核心產品開發進度')).toBeInTheDocument();
    expect(screen.getByText('準時完成 Q3 路線圖中的 A、B 模組。')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '目標值' })).not.toBeInTheDocument();
    expect(screen.queryByText('通過率 >= 95%')).not.toBeInTheDocument();
    expect(screen.queryByText('gte 2 times')).not.toBeInTheDocument();
  });

  it('renders loading, empty, and error states without mock rows', () => {
    const { rerender } = render(
      <CurrentKpiStandardsContent isLoading errorMessage={null} standards={[]} />,
    );

    expect(screen.getByText('載入 KPI 標準中...')).toBeInTheDocument();

    rerender(
      <CurrentKpiStandardsContent isLoading={false} errorMessage={null} standards={[]} />,
    );
    expect(screen.getByText('目前尚未設定 KPI 標準。')).toBeInTheDocument();
    expect(screen.queryByText('核心產品開發進度')).not.toBeInTheDocument();

    rerender(
      <CurrentKpiStandardsContent
        isLoading={false}
        errorMessage="找不到目前應顯示的 KPI 週期。"
        standards={[]}
      />,
    );
    expect(screen.getByText('找不到目前應顯示的 KPI 週期。')).toBeInTheDocument();
  });

  it('renders KPI result data from backend-shaped data', () => {
    const onConfirm = vi.fn();
    const onDispute = vi.fn();

    render(
      <CurrentKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={result}
        onConfirm={onConfirm}
        onDispute={onDispute}
      />,
    );

    expect(screen.getByText('94.5')).toBeInTheDocument();
    expect(screen.getAllByText('125%')).toHaveLength(2);
    expect(screen.getByText('核心產品開發進度')).toBeInTheDocument();
    expect(screen.getByText('(實際值: 5 / 目標值: 4)')).toBeInTheDocument();
    expect(screen.getByText('Q3 已完成 5 個模組並完成驗收。')).toBeInTheDocument();
    expect(screen.queryByText('91.5')).not.toBeInTheDocument();
    expect(screen.queryByText('客戶滿意度 (NPS)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '確認評估結果' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders result loading, not published, empty, and error states', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <CurrentKpiResultsContent
        isLoading
        errorMessage={null}
        result={null}
        onConfirm={noop}
        onDispute={noop}
      />,
    );

    expect(screen.getByText('載入 KPI 考核結果中...')).toBeInTheDocument();

    rerender(
      <CurrentKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={{ status: 'not_published' }}
        onConfirm={noop}
        onDispute={noop}
      />,
    );
    expect(screen.getByText('本期 KPI 考核結果尚未公佈。')).toBeInTheDocument();

    rerender(
      <CurrentKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={{
          ...result,
          kpi_results: [],
          available_actions: {
            can_confirm: false,
            confirm_unavailable_reason: 'result_incomplete',
          },
        }}
        onConfirm={noop}
        onDispute={noop}
      />,
    );
    expect(screen.getByText('KPI 結果尚未計算完成。')).toBeInTheDocument();

    rerender(
      <CurrentKpiResultsContent
        isLoading={false}
        errorMessage="找不到目前應顯示的 KPI 週期。"
        result={null}
        onConfirm={noop}
        onDispute={noop}
      />,
    );
    expect(screen.getByText('找不到目前應顯示的 KPI 週期。')).toBeInTheDocument();
  });
});
