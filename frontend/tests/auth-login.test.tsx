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

describe('JWT login feature', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('stores the pasted JWT and navigates back to the redirect path', () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText('JWT'), {
      target: { value: 'dev-jwt-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: '儲存並繼續' }));

    expect(localStorage.getItem('token')).toBe('dev-jwt-token');
    expect(screen.getByTestId('location')).toHaveTextContent('/performance/current');
  });

  it('falls back to profile for unsafe redirect values', () => {
    renderLogin('/login?redirect=https://example.com');

    fireEvent.change(screen.getByLabelText('JWT'), {
      target: { value: 'dev-jwt-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: '儲存並繼續' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
