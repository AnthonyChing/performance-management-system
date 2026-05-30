import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Login } from '../src/features/auth';
import type { GoogleCredentialResponse } from '../src/features/auth/types';

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

let googleCredentialCallback: ((response: GoogleCredentialResponse) => void) | null = null;

function mockGoogleIdentityServices() {
  vi.stubGlobal('google', {
    accounts: {
      id: {
        initialize: vi.fn(({ callback }) => {
          googleCredentialCallback = callback;
        }),
        renderButton: vi.fn((parent: HTMLElement) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = 'Sign in with Google';
          button.addEventListener('click', () => {
            googleCredentialCallback?.({ credential: 'google-id-token' });
          });
          parent.appendChild(button);
        }),
        prompt: vi.fn(),
      },
    },
  });
}

function mockGoogleAuthResponse() {
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        access_token: 'backend-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user_id: 'user-id',
        roles: ['EMPLOYEE'],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('Google login feature', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client-id');
    mockGoogleIdentityServices();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    googleCredentialCallback = null;
  });

  it('exchanges the Google credential, stores the access token, and navigates back', async () => {
    const fetchMock = mockGoogleAuthResponse();
    localStorage.setItem('accessToken', 'stale-access-token');

    renderLogin();

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in with Google' }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('backend-access-token');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(screen.getByTestId('location')).toHaveTextContent('/performance/current');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/google',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id_token: 'google-id-token' }),
      }),
    );
  });

  it('falls back to profile for unsafe redirect values', async () => {
    mockGoogleAuthResponse();

    renderLogin('/login?redirect=https://example.com');

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in with Google' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/');
    });
  });
});
