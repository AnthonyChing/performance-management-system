import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { CurrentCycleCard, ProfileView } from '../src/pages/Profile';
import type {
  CurrentPerformanceCycleResponse,
  PerformanceCycleStatus,
  ProfileResponse,
} from '../src/api/employee';

const profileData: ProfileResponse = {
  profile: {
    user_id: 'user_001',
    employee_id: 'PP-88293',
    name: '陳大文',
    english_name: 'David Chen',
    avatar_url: null,
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

const cycleData: CurrentPerformanceCycleResponse = {
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

function renderProfileView(
  overrides: Partial<ComponentProps<typeof ProfileView>> = {},
) {
  return render(
    <ProfileView
      profileData={profileData}
      cycleData={cycleData}
      isProfileLoading={false}
      isCycleLoading={false}
      profileErrorMessage={null}
      cycleErrorMessage={null}
      hasCurrentCycle={true}
      {...overrides}
    />,
  );
}

describe('ProfileView rendering', () => {
  it('renders profile and current cycle data from props', () => {
    renderProfileView();

    expect(screen.getByRole('heading', { name: '我的資料頁面' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '陳大文 (David Chen)' })).toBeInTheDocument();
    expect(screen.getByText('員工編號: #PP-88293')).toBeInTheDocument();
    expect(screen.getByText('資深軟體工程師')).toBeInTheDocument();
    expect(screen.getByText('技術研發部')).toBeInTheDocument();
    expect(screen.getByText('台北總部')).toBeInTheDocument();
    expect(screen.getByText('david.chen@performanceplus.com')).toBeInTheDocument();
    expect(screen.getByText('DC')).toBeInTheDocument();
    expect(screen.getByText('已公佈考核結果')).toBeInTheDocument();
    expect(screen.getByText('2024 Q3 年度績效考核')).toBeInTheDocument();
    expect(screen.getByText('（考核週期：2024-07-01~2024-09-30）')).toBeInTheDocument();
  });

  it('renders profile loading state', () => {
    renderProfileView({
      profileData: null,
      cycleData: null,
      isProfileLoading: true,
      isCycleLoading: true,
    });

    expect(screen.getByText('載入我的資料中...')).toBeInTheDocument();
  });

  it('renders profile error state', () => {
    renderProfileView({
      profileData: null,
      cycleData: null,
      profileErrorMessage: '查無目前登入者的員工資料。',
    });

    expect(screen.getByText('查無目前登入者的員工資料。')).toBeInTheDocument();
  });

  it('renders current cycle loading state while keeping profile visible', () => {
    renderProfileView({
      cycleData: null,
      isCycleLoading: true,
    });

    expect(screen.getByRole('heading', { name: '陳大文 (David Chen)' })).toBeInTheDocument();
    expect(screen.getByText('載入目前考核週期中...')).toBeInTheDocument();
  });

  it('renders empty current cycle state', () => {
    renderProfileView({
      cycleData: null,
      hasCurrentCycle: false,
    });

    expect(screen.getByText('目前沒有可顯示的考核週期。')).toBeInTheDocument();
  });

  it('renders current cycle error state', () => {
    renderProfileView({
      cycleData: null,
      cycleErrorMessage: '尚未登入或 token 失效。',
    });

    expect(screen.getByText('尚未登入或 token 失效。')).toBeInTheDocument();
  });
});

describe('CurrentCycleCard status rendering', () => {
  it.each([
    ['not_started', '尚未開始'],
    ['in_progress', '進行中'],
    ['locked', '已鎖定'],
    ['results_published', '已公佈考核結果'],
    ['completed', '已完成'],
    ['closed', '已關閉'],
  ] satisfies Array<[PerformanceCycleStatus, string]>)(
    'status=%s renders %s',
    (status, expectedLabel) => {
      render(
        <CurrentCycleCard
          cycle={{
            ...cycleData.cycle,
            status,
          }}
        />,
      );

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      expect(screen.getByText('2024 Q3 年度績效考核')).toBeInTheDocument();
    },
  );
});
