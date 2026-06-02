import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryKPI, {
  HistoryKpiContent,
} from '../src/features/performance/pages/HistoryKPI';
import HistoryKPIDetail, {
  HistoryKpiResultsContent,
} from '../src/features/performance/pages/HistoryKPIDetail';
import type {
  EmployeePagination,
  KpiResultSummary,
  KpiStandard,
} from '../src/api/employee';

const pagination: EmployeePagination = {
  page: 1,
  page_size: 10,
  total_pages: 1,
  total_count: 1,
  has_previous: false,
  has_next: false,
};

const result: KpiResultSummary = {
  result_id: 'review_2024_q4_user_001',
  cycle: {
    cycle_id: 'cycle_2024_q4',
    name: '2024 Q4 年度終考',
    period_label: '2024-10-01~2024-12-31',
    start_date: '2024-10-01',
    end_date: '2024-12-31',
  },
  status: 'finalized',
  score_summary: {
    performance_score: 94.5,
    kpi_achievement_percent: 103.2,
    manager_review_score: 92,
  },
  weighted_score: 61.9,
  review_score: 92,
  final_grade: 'meets_expectations',
  manager_evaluation: {
    score: 92,
    comment: '整體表現優異。',
  },
  kpi_results: [
    {
      kpi_id: 'kpi_core_product_quality',
      name: '核心產品開發進度',
      weight_percent: 60,
      actual: {
        value: 98,
        unit: 'percent',
        display_text: '98%',
      },
      target: {
        value: 95,
        unit: 'percent',
        display_text: '95%',
      },
      achievement_percent: 103.2,
      score: 61.9,
      latest_snapshot: {
        snapshot_id: 'snapshot_h_001',
        value: 98,
        note: '已完成驗收並達成品質門檻。',
      },
    },
  ],
  updated_at: '2025-01-08T09:00:00+08:00',
};

const sparseResult: KpiResultSummary = {
  result_id: 'review_2024_q4_user_001',
  cycle: result.cycle,
  status: 'confirmed',
};

const standards: KpiStandard[] = [
  {
    kpi_id: 'kpi_core_product_quality',
    name: '核心產品開發進度',
    description: '準時完成 Q4 路線圖中的核心模組。',
    weight_percent: 60,
    target: {
      operator: 'gte',
      value: 95,
      unit: 'percent',
      display_text: '通過率 >= 95%',
    },
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

describe('employee historical KPI pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads historical KPI results from the backend API path', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        mode: 'historical_results',
        pagination,
        results: [result],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    localStorage.setItem('token', 'dev-jwt-token');

    render(
      <MemoryRouter initialEntries={['/performance/history']}>
        <HistoryKPI />
      </MemoryRouter>,
    );

    expect(await screen.findByText('2024 Q4 年度終考')).toBeInTheDocument();
    expect(screen.getByText('考核區間：2024-10-01 至 2024-12-31')).toBeInTheDocument();
    expect(screen.getByText('94.5')).toBeInTheDocument();
    expect(screen.getByText('符合預期')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /查看詳情/i })).toHaveAttribute(
      'href',
      '/performance/history/cycle_2024_q4',
    );
    expect(screen.queryByText('2023 第四季度 (Q4) 年度終考')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/result?status=historical&page=1&pageSize=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-jwt-token',
        }),
      }),
    );
  });

  it('renders historical KPI list loading, empty, and sparse backend rows', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <HistoryKpiContent
          isLoading
          errorMessage={null}
          results={[]}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('載入歷史 KPI 中...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <HistoryKpiContent
          isLoading={false}
          errorMessage={null}
          results={[]}
          pagination={null}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('目前尚無歷史 KPI 資料。')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <HistoryKpiContent
          isLoading={false}
          errorMessage={null}
          results={[sparseResult]}
          pagination={pagination}
          onPageChange={noop}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('2024 Q4 年度終考')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('loads one historical KPI detail from the backend', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        mode: 'historical_result_detail',
        standards,
        result,
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/performance/history/cycle_2024_q4']}>
        <Routes>
          <Route path="/performance/history/:id" element={<HistoryKPIDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('核心產品開發進度')).toBeInTheDocument();
    expect(screen.getByText('準時完成 Q4 路線圖中的核心模組。')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '目標值' })).not.toBeInTheDocument();
    expect(screen.queryByText('通過率 >= 95%')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/result?status=historical&page=1&pageSize=100&cycleId=cycle_2024_q4',
      expect.objectContaining({
        method: 'GET',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '考核結果' }));
    expect(await screen.findByText('94.5')).toBeInTheDocument();
    expect(screen.getByText('符合預期')).toBeInTheDocument();
    expect(screen.getByText('問卷分數')).toBeInTheDocument();
    expect(screen.getAllByText('103.2%')).toHaveLength(2);
    expect(screen.getByText('(實際值: 98% / 目標值: 95%)')).toBeInTheDocument();
    expect(screen.getByText('已完成驗收並達成品質門檻。')).toBeInTheDocument();
  });

  it('renders historical KPI result loading, empty, detail rows, and sparse responses', () => {
    const { rerender } = render(
      <HistoryKpiResultsContent isLoading errorMessage={null} result={null} />,
    );

    expect(screen.getByText('載入歷史 KPI 考核結果中...')).toBeInTheDocument();

    rerender(
      <HistoryKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={null}
      />,
    );
    expect(screen.getByText('目前沒有可顯示的歷史 KPI 考核結果。')).toBeInTheDocument();

    rerender(
      <HistoryKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={{ ...result, kpi_results: [] }}
      />,
    );
    expect(screen.getByText('此歷史週期沒有可顯示的 KPI 達成明細。')).toBeInTheDocument();

    rerender(
      <HistoryKpiResultsContent
        isLoading={false}
        errorMessage={null}
        result={sparseResult}
      />,
    );
    expect(screen.getByText('已確認')).toBeInTheDocument();
  });
});
