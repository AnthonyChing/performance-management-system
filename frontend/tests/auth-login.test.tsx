import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Login } from '../src/features/auth';

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

function renderLogin(initialEntry = '/login?redirect=/performance/current') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

import { vi } from 'vitest';

describe('Email login feature', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits email and navigates back to the redirect path', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mandy.ma@acme.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/auth/dev-login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'mandy.ma@acme.test' }),
      }),
    );
    expect(await screen.findByTestId('location')).toHaveTextContent('/performance/current');
  });

  it('falls back to profile for unsafe redirect values', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    renderLogin('/login?redirect=https://example.com');

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mandy.ma@acme.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/');
  });
});
