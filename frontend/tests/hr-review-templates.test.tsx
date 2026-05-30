import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEvaluationTemplate,
  listEvaluationTemplates,
} from '../src/api/hr';
import CreateTemplate from '../src/features/hr/review-templates/pages/CreateTemplate';
import ReviewTemplateDetail from '../src/features/hr/review-templates/pages/ReviewTemplateDetail';
import ReviewTemplates from '../src/features/hr/review-templates/pages/ReviewTemplates';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

const evaluationTemplateListPayload = {
  data: [
    {
      template_id: 'eval-template-001',
      cycle: {
        cycle_id: 'cycle-2027',
        name: '2027 年度考核',
        cycle_type: 'annual',
        status: 'not_started',
      },
      name: '2027 研發部門考核',
      description: '研發部門年度考核',
      status: 'published',
      employee_group: {
        group_id: 'all',
        group_type: 'all',
        name: '全體員工',
      },
      assessment_template_count: 2,
      total_weight_percent: 100,
      available_actions: {
        can_edit: true,
        can_archive: true,
      },
      updated_at: '2027-01-10T08:00:00+08:00',
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 1,
    total_count: 1,
  },
};

const evaluationTemplatePayload = {
  template_id: 'eval-template-001',
  cycle: {
    cycle_id: 'cycle-2027',
    name: '2027 年度考核',
    cycle_type: 'annual',
    status: 'not_started',
  },
  name: '2027 研發部門考核',
  description: '研發部門年度考核',
  status: 'published',
  employee_group: {
    group_id: 'department:dept-rd',
    group_type: 'department',
    name: '技術研發部',
    description: '目前隸屬技術研發部的員工',
  },
  assessment_templates: [
    {
      assessment_template_id: 'assessment-template-001',
      assessment_template_version_id: 'assessment-version-001',
      name: '核心勝任力評估',
      question_count: 8,
      weight_percent: 60,
    },
    {
      assessment_template_id: 'assessment-template-002',
      assessment_template_version_id: 'assessment-version-002',
      name: '業務目標達成',
      question_count: 4,
      weight_percent: 40,
    },
  ],
  total_weight_percent: 100,
  available_actions: {
    can_edit: true,
    can_archive: true,
    edit_blocked_reason: null,
  },
  created_by: 'hr-user',
  updated_by: 'hr-user',
  created_at: '2027-01-01T08:00:00+08:00',
  updated_at: '2027-01-10T08:00:00+08:00',
};

const archivedEvaluationTemplatePayload = {
  ...evaluationTemplatePayload,
  status: 'archived',
  available_actions: {
    can_edit: false,
    can_archive: false,
    edit_blocked_reason: 'TEMPLATE_ARCHIVED',
  },
};

function setupFetchForCreate() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);

    if (path === '/api/v1/hr/performance-cycles?status=not_started') {
      return jsonResponse({
        data: [
          {
            id: 'cycle-2027',
            name: '2027 年度考核',
            cycle_type: 'annual',
            status: 'not_started',
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: 1,
        },
      });
    }

    if (path === '/api/v1/hr/employee-groups') {
      return jsonResponse({
        data: [
          {
            group_id: 'department:dept-rd',
            group_type: 'department',
            name: '技術研發部',
            description: '目前隸屬技術研發部的員工',
          },
        ],
      });
    }

    if (path === '/api/v1/hr/assessment-templates?status=published') {
      return jsonResponse({
        data: [
          {
            id: 'assessment-template-001',
            name: '核心勝任力評估',
            job_category: 'engineering',
            status: 'published',
            is_active: true,
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: 1,
        },
      });
    }

    if (path === '/api/v1/hr/evaluation-templates' && init?.method === 'POST') {
      return jsonResponse(evaluationTemplatePayload, { status: 201 });
    }

    return jsonResponse({ error: { code: 'NOT_FOUND', message: path } }, { status: 404 });
  });
}

function setupFetchForCreateWithOverrides(
  overrides: {
    cycles?: unknown[];
    groups?: unknown[];
    assessmentTemplates?: unknown[];
    submitResponse?: Response;
  } = {},
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);

    if (path === '/api/v1/hr/performance-cycles?status=not_started') {
      return jsonResponse({
        data: overrides.cycles ?? [
          {
            id: 'cycle-2027',
            name: '2027 年度考核',
            cycle_type: 'annual',
            status: 'not_started',
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: (overrides.cycles ?? [1]).length,
        },
      });
    }

    if (path === '/api/v1/hr/employee-groups') {
      return jsonResponse({
        data: overrides.groups ?? [
          {
            group_id: 'department:dept-rd',
            group_type: 'department',
            name: '技術研發部',
            description: '目前隸屬技術研發部的員工',
          },
        ],
      });
    }

    if (path === '/api/v1/hr/assessment-templates?status=published') {
      return jsonResponse({
        data: overrides.assessmentTemplates ?? [
          {
            id: 'assessment-template-001',
            name: '核心勝任力評估',
            job_category: 'engineering',
            status: 'published',
            is_active: true,
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: (overrides.assessmentTemplates ?? [1]).length,
        },
      });
    }

    if (path === '/api/v1/hr/evaluation-templates' && init?.method === 'POST') {
      return overrides.submitResponse ?? jsonResponse(evaluationTemplatePayload, { status: 201 });
    }

    return jsonResponse({ error: { code: 'NOT_FOUND', message: path } }, { status: 404 });
  });
}

describe('HR evaluation template API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends stored JWT when listing evaluation templates', async () => {
    const fetcher = vi.fn(async () => jsonResponse(evaluationTemplateListPayload));

    await listEvaluationTemplates({ page: 1 }, { fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/evaluation-templates?page=1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
        }),
      }),
    );
  });

  it('posts backend-shaped evaluation template payloads', async () => {
    const fetcher = vi.fn(async () => jsonResponse(evaluationTemplatePayload, { status: 201 }));

    await createEvaluationTemplate(
      {
        cycle_id: 'cycle-2027',
        name: '2027 研發部門考核',
        employee_group_id: 'department:dept-rd',
        assessment_templates: [
          {
            assessment_template_id: 'assessment-template-001',
            weight_percent: 100,
          },
        ],
      },
      { fetcher, authToken: 'raw-token' },
    );

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/evaluation-templates',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
        }),
        body: JSON.stringify({
          cycle_id: 'cycle-2027',
          name: '2027 研發部門考核',
          employee_group_id: 'department:dept-rd',
          assessment_templates: [
            {
              assessment_template_id: 'assessment-template-001',
              weight_percent: 100,
            },
          ],
        }),
      }),
    );
  });
});

describe('HR evaluation template pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the review template list from the backend API', async () => {
    const fetcher = vi.fn(async () => jsonResponse(evaluationTemplateListPayload));
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates']}>
        <ReviewTemplates />
      </MemoryRouter>,
    );

    expect(await screen.findByText('2027 研發部門考核')).toBeInTheDocument();
    expect(screen.getByText('適用對象: 全體員工')).toBeInTheDocument();
    expect(screen.queryByText('2023年度績效考核範本')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/evaluation-templates?page=1&page_size=50',
      expect.objectContaining({
        headers: expect.objectContaining({
        }),
      }),
    );
  });

  it('renders an empty state when the template list is empty', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [],
        meta: {
          current_page: 1,
          total_pages: 0,
          total_count: 0,
        },
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates']}>
        <ReviewTemplates />
      </MemoryRouter>,
    );

    expect(await screen.findByText('目前沒有符合條件的考核模板。')).toBeInTheDocument();
  });

  it('renders a permission error when the template list API returns 403', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Forbidden',
          },
        },
        { status: 403 },
      ),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates']}>
        <ReviewTemplates />
      </MemoryRouter>,
    );

    expect(await screen.findByText('目前帳號沒有 HR 權限。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新載入' })).toBeInTheDocument();
  });

  it('creates an evaluation template through the wizard', async () => {
    const fetcher = setupFetchForCreate();
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <Routes>
          <Route path="/hr/templates/new" element={<CreateTemplate />} />
          <Route path="/hr/templates/:id" element={<div>建立完成</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('考核基本資料設定');

    fireEvent.change(screen.getByLabelText('考核名稱'), {
      target: { value: '2027 研發部門考核' },
    });
    fireEvent.change(screen.getByLabelText('說明'), {
      target: { value: '研發部門年度考核' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await screen.findByText('選擇問卷模板');
    fireEvent.click(screen.getByRole('button', { name: '請勾選問卷模板' }));
    fireEvent.click(screen.getByLabelText('核心勝任力評估'));
    fireEvent.click(screen.getByRole('button', { name: '確定' }));
    expect(screen.queryByRole('button', { name: '確定' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await screen.findByRole('heading', { name: '確認發布' });
    fireEvent.click(screen.getByRole('button', { name: '確認發布' }));

    expect(await screen.findByText('建立完成')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        '/api/v1/hr/evaluation-templates',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            cycle_id: 'cycle-2027',
            name: '2027 研發部門考核',
            description: '研發部門年度考核',
            employee_group_id: 'department:dept-rd',
            assessment_templates: [
              {
                assessment_template_id: 'assessment-template-001',
                weight_percent: 100,
              },
            ],
          }),
        }),
      );
    });
  });

  it('renders an auth error when create page option loading returns 401', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);

      if (path === '/api/v1/hr/performance-cycles?status=not_started') {
        return jsonResponse(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Unauthorized',
            },
          },
          { status: 401 },
        );
      }

      return jsonResponse({
        data: [],
        meta: {
          current_page: 1,
          total_pages: 0,
          total_count: 0,
        },
      });
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <CreateTemplate />
      </MemoryRouter>,
    );

    expect(await screen.findByText('尚未登入或 token 失效。')).toBeInTheDocument();
  });

  it('blocks the wizard when no not-started cycle is available', async () => {
    const fetcher = setupFetchForCreateWithOverrides({ cycles: [] });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <CreateTemplate />
      </MemoryRouter>,
    );

    await screen.findByText('考核基本資料設定');
    fireEvent.change(screen.getByLabelText('考核名稱'), {
      target: { value: '2027 研發部門考核' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(screen.getByText('請選擇考核週期。')).toBeInTheDocument();
  });

  it('renders an empty state when no published questionnaire template is available', async () => {
    const fetcher = setupFetchForCreateWithOverrides({ assessmentTemplates: [] });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <CreateTemplate />
      </MemoryRouter>,
    );

    await screen.findByText('考核基本資料設定');
    fireEvent.change(screen.getByLabelText('考核名稱'), {
      target: { value: '2027 研發部門考核' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(await screen.findByText('目前沒有已發布的問卷模板。')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('請至少選擇一份已發布問卷模板。')).toBeInTheDocument();
  });

  it('validates questionnaire selection and total weight before confirmation', async () => {
    const fetcher = setupFetchForCreate();
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <CreateTemplate />
      </MemoryRouter>,
    );

    await screen.findByText('考核基本資料設定');
    fireEvent.change(screen.getByLabelText('考核名稱'), {
      target: { value: '2027 研發部門考核' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await screen.findByText('選擇問卷模板');
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('請至少選擇一份已發布問卷模板。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '請勾選問卷模板' }));
    fireEvent.click(screen.getByLabelText('核心勝任力評估'));
    fireEvent.click(screen.getByRole('button', { name: '確定' }));
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '90' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(screen.getByText('請確保總配分比例等於 100%。')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '確認發布' })).not.toBeInTheDocument();
  });

  it('renders backend errors when creating a template fails', async () => {
    const fetcher = setupFetchForCreateWithOverrides({
      submitResponse: jsonResponse(
        {
          error: {
            code: 'CYCLE_TEMPLATE_CONFLICT',
            message: 'An active evaluation template already exists for this cycle and employee group.',
          },
        },
        { status: 409 },
      ),
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/new']}>
        <CreateTemplate />
      </MemoryRouter>,
    );

    await screen.findByText('考核基本資料設定');
    fireEvent.change(screen.getByLabelText('考核名稱'), {
      target: { value: '2027 研發部門考核' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await screen.findByText('選擇問卷模板');
    fireEvent.click(screen.getByRole('button', { name: '請勾選問卷模板' }));
    fireEvent.click(screen.getByLabelText('核心勝任力評估'));
    fireEvent.click(screen.getByRole('button', { name: '確定' }));
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await screen.findByRole('heading', { name: '確認發布' });
    fireEvent.click(screen.getByRole('button', { name: '確認發布' }));

    expect(
      await screen.findByText(
        'An active evaluation template already exists for this cycle and employee group.',
      ),
    ).toBeInTheDocument();
  });

  it('loads template detail and archives it through the backend API', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);

      if (path === '/api/v1/hr/evaluation-templates/eval-template-001' && init?.method === 'PATCH') {
        return jsonResponse(archivedEvaluationTemplatePayload);
      }

      return jsonResponse(evaluationTemplatePayload);
    });
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/eval-template-001']}>
        <Routes>
          <Route path="/hr/templates/:id" element={<ReviewTemplateDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('研發部門年度考核')).toBeInTheDocument();
    expect(screen.getByText('核心勝任力評估')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '封存模板' }));

    expect(await screen.findByText('已封存')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/hr/evaluation-templates/eval-template-001',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'archived' }),
      }),
    );
  });

  it('renders a not-found error when detail loading fails', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Evaluation template not found.',
          },
        },
        { status: 404 },
      ),
    );
    vi.stubGlobal('fetch', fetcher);

    render(
      <MemoryRouter initialEntries={['/hr/templates/missing-template']}>
        <Routes>
          <Route path="/hr/templates/:id" element={<ReviewTemplateDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('找不到此考核模板。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新載入' })).toBeInTheDocument();
  });
});
