import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from '../src/shared/layout/Layout';
import { getMyProfile } from '../src/api/employee';

vi.mock('../src/api/employee', () => ({
  getMyProfile: vi.fn(),
}));

const mockedGetMyProfile = vi.mocked(getMyProfile);

function mockProfileResponse() {
  mockedGetMyProfile.mockResolvedValue({
    profile: {
      user_id: '00000000-0000-0000-0000-0000000000a1',
      employee_id: 'E-HR001',
      name: 'Helen Ho',
      english_name: null,
      avatar_url: null,
      job_title: 'HR Business Partner',
      job_category: 'hr',
      department: {
        department_id: '00000000-0000-0000-0000-000000000013',
        name: 'People & Culture',
      },
      location: null,
      email: 'helen.ho@acme.test',
      employment_status: 'active',
      terminated_at: null,
      manager: null,
    },
  });
}

describe('Layout current user', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the signed-in user in the sidebar instead of mock user data', async () => {
    mockProfileResponse();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Profile page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Helen Ho')).toBeInTheDocument();
    expect(screen.getByText('HR Business Partner')).toBeInTheDocument();
    expect(screen.queryByText('林佳龍 Chia Long')).not.toBeInTheDocument();
    expect(screen.queryByText('專案經理')).not.toBeInTheDocument();
  });
});
