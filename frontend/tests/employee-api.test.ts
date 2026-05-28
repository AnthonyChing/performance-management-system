import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiRequestError,
  ApiResponseValidationError,
  confirmMyKpiResult,
  createMyGoal,
  getCurrentPerformanceCycle,
  getMyCurrentGoals,
  getMyKpiResult,
  getMyKpiStandards,
  getMyProfile,
  resolveEmployeeApiUrl,
  updateMyGoalProgress,
  type Fetcher,
} from '../src/api/employee';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

const profilePayload = {
  profile: {
    user_id: 'user_001',
    employee_id: 'PP-88293',
    name: '陳大文',
    english_name: 'David Chen',
    avatar_url: '/assets/avatar/PP-88293.png',
    job_title: '資深軟體工程師',
    job_category: 'engineering',
    department: {
      department_id: 'dept_engineering',
      name: '技術研發部',
    },
    location: '台北總部',
    email: 'david.chen@performanceplus.com',
    employment_status: 'active',
    terminated_at: null,
    manager: {
      user_id: 'user_manager_001',
      name: '林美玲',
      english_name: 'Mei Lin',
      email: 'mei.lin@performanceplus.com',
    },
  },
};

const cyclePayload = {
  cycle: {
    cycle_id: 'cycle_2024_q3',
    name: '2024 Q3 年度績效考核',
    cycle_type: 'quarterly',
    period_label: '2024-07-01~2024-09-30',
    start_date: '2024-07-01',
    end_date: '2024-09-30',
    timezone: 'Asia/Taipei',
    status: 'results_published',
    is_locked: true,
    results_published_at: '2024-10-15T17:00:00+08:00',
    updated_at: '2024-10-15T17:00:00+08:00',
  },
};

const kpiStandardsPayload = {
  cycle: {
    cycle_id: 'cycle_2024_q3',
    name: '2024 年度 Q3 績效指標與評估',
    period_label: '2024-07-01~2024-09-30',
    start_date: '2024-07-01',
    end_date: '2024-09-30',
  },
  employee: {
    user_id: 'user_001',
    name: '陳大文',
  },
  standards: [
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
  ],
};

const kpiResultPayload = {
  result: {
    result_id: 'review_001',
    cycle: {
      cycle_id: 'cycle_2024_q3',
      name: '2024 年度 Q3 績效指標與評估',
    },
    employee: {
      user_id: 'user_001',
      name: '陳大文',
    },
    status: 'pending_confirmation',
    score_summary: {
      performance_score: 94.5,
      kpi_achievement_percent: 103.6,
      manager_review_score: 88,
    },
    weighted_score: 103.6,
    review_score: 88,
    final_grade: null,
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
          snapshot_id: 'kpi_snapshot_001',
          value: 5,
          note: 'Q3 已完成 5 個模組並完成驗收。',
          recorded_at: '2025-10-10T18:00:00+08:00',
        },
      },
    ],
    available_actions: {
      can_confirm: true,
      confirm_unavailable_reason: null,
      can_dispute: false,
      dispute_unavailable_reason: 'not_open',
    },
    confirmation: null,
    dispute_period: {
      status: 'not_open',
      start_date: '2025-10-16',
      end_date: '2025-10-20',
    },
  },
};

const kpiConfirmationPayload = {
  confirmation: {
    confirmation_id: 'confirmation_001',
    result_id: 'review_001',
    confirmed_at: '2025-10-16T09:30:00+08:00',
    confirmed_by: {
      user_id: 'user_001',
      name: '陳大文',
    },
  },
  result: {
    result_id: 'review_001',
    status: 'confirmed',
    available_actions: {
      can_confirm: false,
      confirm_unavailable_reason: 'already_confirmed',
      can_dispute: false,
      dispute_unavailable_reason: 'already_confirmed',
    },
  },
};

const currentGoalsPayload = {
  cycle: {
    cycle_id: 'cycle_2024_q3',
    name: '2024 Q3 Quarterly Review',
    period_label: '2024-07-01~2024-09-30',
    start_date: '2024-07-01',
    end_date: '2024-09-30',
    status: 'in_progress',
    is_locked: false,
  },
  available_actions: {
    can_create_goal: true,
  },
  summary: {
    total_count: 1,
    pending_review_count: 0,
    in_progress_count: 1,
    revision_requested_count: 0,
    completed_count: 0,
    cancelled_count: 0,
  },
  goals: [
    {
      goal_id: 'goal_001',
      cycle_id: 'cycle_2024_q3',
      goal_type: 'individual',
      title: '完成推薦系統重構',
      description: '完成核心服務拆分與壓測。',
      due_date: '2024-09-15',
      status: 'in_progress',
      progress_percent: 60,
      owner: {
        user_id: 'user_001',
        name: '陳大文',
        department: '技術研發部',
      },
      reviewer: {
        user_id: 'user_manager_001',
        name: '林美玲',
      },
      latest_progress_update: {
        progress_update_id: 'progress_001',
        progress_percent: 60,
        note: '已完成 API 拆分。',
        created_at: '2024-08-10T09:30:00+08:00',
        created_by: {
          user_id: 'user_001',
          name: '陳大文',
        },
      },
      available_actions: {
        can_edit: false,
        edit_unavailable_reason: 'invalid_goal_status',
        can_update_progress: true,
      },
    },
  ],
};

const goalProgressUpdatePayload = {
  progress_update: {
    progress_update_id: 'progress_002',
    goal_id: 'goal_001',
    progress_percent: 80,
    note: '已完成新版客服流程試行。',
    created_at: '2024-08-20T14:30:00+08:00',
    created_by: {
      user_id: 'user_001',
      name: '陳大文',
    },
  },
  goal: {
    goal_id: 'goal_001',
    status: 'in_progress',
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
};

const goalCreationPayload = {
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
    created_at: '2024-08-20T14:30:00+08:00',
    updated_at: '2024-08-20T14:30:00+08:00',
  },
};

describe('employee API client', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('resolves employee API URLs with /api/v1 on the same origin', () => {
    expect(resolveEmployeeApiUrl('/me/profile')).toBe('/api/v1/me/profile');
    expect(resolveEmployeeApiUrl('me/profile')).toBe('/api/v1/me/profile');
  });

  it('GET /me/profile uses /api/v1 prefix and returns the profile payload', async () => {
    const fetcher = vi.fn(async () => jsonResponse(profilePayload)) satisfies Fetcher;

    await expect(getMyProfile({ fetcher })).resolves.toEqual(profilePayload);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/profile',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('GET /me/profile attaches a bearer token when one is available', async () => {
    const fetcher = vi.fn(async () => jsonResponse(profilePayload)) satisfies Fetcher;

    await getMyProfile({ fetcher, authToken: 'local-jwt' });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer local-jwt',
        }),
      }),
    );
  });

  it('GET /me/profile reads JWT from browser storage by default', async () => {
    const fetcher = vi.fn(async () => jsonResponse(profilePayload)) satisfies Fetcher;
    localStorage.setItem('token', 'stored-jwt');

    await getMyProfile({ fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer stored-jwt',
        }),
      }),
    );
  });

  it('GET /me/profile supports an abort signal while using the same-origin API path', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async () => jsonResponse(profilePayload)) satisfies Fetcher;

    await getMyProfile({
      fetcher,
      signal: controller.signal,
    });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/profile',
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });

  it('GET /me/profile accepts nullable fields omitted by the backend', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        profile: {
          user_id: 'user_001',
          employee_id: 'PP-88293',
          name: '陳大文',
          job_title: '資深軟體工程師',
          job_category: 'engineering',
          department: {
            department_id: 'dept_engineering',
            name: '技術研發部',
          },
          email: 'david.chen@performanceplus.com',
          employment_status: 'active',
        },
      }),
    ) satisfies Fetcher;

    await expect(getMyProfile({ fetcher })).resolves.toMatchObject({
      profile: {
        user_id: 'user_001',
      },
    });
  });

  it('GET /me/profile rejects response shapes that do not match employee_api.md', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        profile: {
          user_id: 'user_001',
        },
      }),
    ) satisfies Fetcher;

    await expect(getMyProfile({ fetcher })).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });

  it('GET /me/profile surfaces USER_NOT_FOUND according to the unified error format', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: '查無目前登入者的員工資料。',
          },
        },
        { status: 404 },
      ),
    ) satisfies Fetcher;

    await expect(getMyProfile({ fetcher })).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 404,
      code: 'USER_NOT_FOUND',
      message: '查無目前登入者的員工資料。',
      details: [],
    });
  });

  it('GET /me/profile falls back to HTTP_ERROR when an error response is not the unified format', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ message: 'Not Found' }, { status: 404 }),
    ) satisfies Fetcher;

    await expect(getMyProfile({ fetcher })).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 404,
      code: 'HTTP_ERROR',
      message: 'HTTP 404',
    });
  });

  it('GET /me/performance-cycles/current uses /api/v1 prefix and returns only cycle data', async () => {
    const fetcher = vi.fn(async () => jsonResponse(cyclePayload)) satisfies Fetcher;

    await expect(getCurrentPerformanceCycle({ fetcher })).resolves.toEqual(cyclePayload);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/performance-cycles/current',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('GET /me/performance-cycles/current surfaces CURRENT_CYCLE_NOT_FOUND', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'CURRENT_CYCLE_NOT_FOUND',
            message: '目前沒有可顯示考核週期。',
          },
        },
        { status: 404 },
      ),
    ) satisfies Fetcher;

    const error = await getCurrentPerformanceCycle({ fetcher }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 404,
      code: 'CURRENT_CYCLE_NOT_FOUND',
      message: '目前沒有可顯示考核週期。',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('GET /me/kpis/standards uses /api/v1 prefix and returns current KPI standards', async () => {
    const fetcher = vi.fn(async () => jsonResponse(kpiStandardsPayload)) satisfies Fetcher;

    await expect(getMyKpiStandards({ fetcher })).resolves.toEqual(kpiStandardsPayload);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/standards',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('GET /me/kpis/standards accepts an empty standards list', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 年度 Q3 績效指標與評估',
        },
        standards: [],
      }),
    ) satisfies Fetcher;

    await expect(getMyKpiStandards({ fetcher })).resolves.toMatchObject({
      standards: [],
    });
  });

  it('GET /me/kpis/standards rejects invalid standard rows', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 年度 Q3 績效指標與評估',
        },
        standards: [
          {
            kpi_id: 'kpi_core_product_quality',
            name: '核心產品開發進度',
            weight_percent: '40',
            target: {},
          },
        ],
      }),
    ) satisfies Fetcher;

    await expect(getMyKpiStandards({ fetcher })).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });

  it('GET /me/kpis/result uses /api/v1 prefix and returns current KPI result', async () => {
    const fetcher = vi.fn(async () => jsonResponse(kpiResultPayload)) satisfies Fetcher;

    await expect(getMyKpiResult({ fetcher })).resolves.toEqual(kpiResultPayload);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/result',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('GET /me/kpis/result accepts sparse not_published responses', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        result: {
          result_id: null,
          cycle: {
            cycle_id: 'cycle_2024_q3',
            name: '2024 年度 Q3 績效指標與評估',
          },
          status: 'not_published',
          available_actions: {
            can_confirm: false,
            confirm_unavailable_reason: 'result_not_published',
            can_dispute: false,
            dispute_unavailable_reason: 'result_not_published',
          },
        },
      }),
    ) satisfies Fetcher;

    await expect(getMyKpiResult({ fetcher })).resolves.toMatchObject({
      result: {
        status: 'not_published',
      },
    });
  });

  it('GET /me/kpis/result rejects invalid result rows', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        result: {
          status: 'pending_confirmation',
          kpi_results: [
            {
              kpi_id: 'kpi_core_product_quality',
              name: '核心產品開發進度',
              weight_percent: '40',
            },
          ],
        },
      }),
    ) satisfies Fetcher;

    await expect(getMyKpiResult({ fetcher })).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });

  it('POST /me/kpis/result-confirmations sends confirmation payload', async () => {
    const fetcher = vi.fn(
      async () => jsonResponse(kpiConfirmationPayload, { status: 201 }),
    ) satisfies Fetcher;

    await expect(confirmMyKpiResult('review_001', { fetcher })).resolves.toEqual(
      kpiConfirmationPayload,
    );

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/kpis/result-confirmations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          result_id: 'review_001',
          confirmed: true,
        }),
      }),
    );
  });

  it('GET /me/goals uses /api/v1 prefix and returns current goals', async () => {
    const fetcher = vi.fn(async () => jsonResponse(currentGoalsPayload)) satisfies Fetcher;

    await expect(getMyCurrentGoals({ fetcher })).resolves.toEqual(currentGoalsPayload);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('GET /me/goals accepts an empty goal list', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
        },
        summary: {
          total_count: 0,
        },
        goals: [],
      }),
    ) satisfies Fetcher;

    await expect(getMyCurrentGoals({ fetcher })).resolves.toMatchObject({
      goals: [],
    });
  });

  it('GET /me/goals rejects invalid goal rows', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        cycle: {
          cycle_id: 'cycle_2024_q3',
          name: '2024 Q3 Quarterly Review',
        },
        goals: [
          {
            goal_id: 'goal_001',
            title: '完成推薦系統重構',
            progress_percent: '60',
          },
        ],
      }),
    ) satisfies Fetcher;

    await expect(getMyCurrentGoals({ fetcher })).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });

  it('POST /me/goals sends a new current goal for review', async () => {
    const fetcher = vi.fn(
      async () => jsonResponse(goalCreationPayload, { status: 201 }),
    ) satisfies Fetcher;

    await expect(
      createMyGoal({
        title: '提升產品技術文件完整度',
        due_date: '2024-09-30',
        description: '補齊核心模組 API 文件。',
      }, { fetcher }),
    ).resolves.toEqual(goalCreationPayload);

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: '提升產品技術文件完整度',
          due_date: '2024-09-30',
          description: '補齊核心模組 API 文件。',
        }),
      }),
    );
  });

  it('POST /me/goals rejects invalid creation responses', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        goal: {
          goal_id: 'goal_002',
          progress_percent: 0,
        },
      }),
    ) satisfies Fetcher;

    await expect(
      createMyGoal({
        title: '提升產品技術文件完整度',
        due_date: '2024-09-30',
        description: '補齊核心模組 API 文件。',
      }, { fetcher }),
    ).rejects.toBeInstanceOf(ApiResponseValidationError);
  });

  it('POST /me/goals/{goal_id}/progress-updates sends progress update payload', async () => {
    const fetcher = vi.fn(
      async () => jsonResponse(goalProgressUpdatePayload, { status: 201 }),
    ) satisfies Fetcher;

    await expect(
      updateMyGoalProgress('goal_001', {
        progress_percent: 80,
        note: '已完成新版客服流程試行。',
      }, { fetcher }),
    ).resolves.toEqual(goalProgressUpdatePayload);

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/me/goals/goal_001/progress-updates',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          progress_percent: 80,
          note: '已完成新版客服流程試行。',
        }),
      }),
    );
  });

  it('POST /me/goals/{goal_id}/progress-updates rejects invalid update responses', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        progress_update: {
          progress_update_id: 'progress_002',
          progress_percent: '80',
        },
        goal: {
          goal_id: 'goal_001',
        },
      }),
    ) satisfies Fetcher;

    await expect(
      updateMyGoalProgress('goal_001', {
        progress_percent: 80,
        note: '已完成新版客服流程試行。',
      }, { fetcher }),
    ).rejects.toBeInstanceOf(ApiResponseValidationError);
  });

  it('surfaces UNAUTHORIZED for protected /me endpoints', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '尚未登入或 token 失效。',
          },
        },
        { status: 401 },
      ),
    ) satisfies Fetcher;

    await expect(getCurrentPerformanceCycle({ fetcher })).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: '尚未登入或 token 失效。',
    });
  });
});
