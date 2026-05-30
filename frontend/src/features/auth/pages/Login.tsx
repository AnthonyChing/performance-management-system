import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JwtLoginForm from '../components/JwtLoginForm';
import { saveAuthToken } from '../tokenStorage';

function normalizeRedirectPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  return redirect;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = useMemo(
    () => normalizeRedirectPath(searchParams.get('redirect')),
    [searchParams],
  );

  function handleTokenSubmit(token: string) {
    saveAuthToken(token);
    navigate(redirectPath, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
      <JwtLoginForm onSubmit={handleTokenSubmit} />
    </div>
  );
}
