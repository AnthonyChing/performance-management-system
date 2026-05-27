import { describe, expect, it, vi } from 'vitest';
import {
  ApiRequestError,
  ApiResponseValidationError,
  getCurrentPerformanceCycle,
  getMyProfile,
  resolveEmployeeApiUrl,
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

describe('employee API client', () => {
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
