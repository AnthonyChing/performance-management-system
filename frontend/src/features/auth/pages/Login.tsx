import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JwtLoginForm from '../components/JwtLoginForm';

function normalizeRedirectPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  return redirect;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = useMemo(
    () => normalizeRedirectPath(searchParams.get('redirect')),
    [searchParams],
  );

  async function handleEmailSubmit(email: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('登入失敗');
      }
      
      // Backend should have set the HttpOnly cookie.
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('無法登入，請檢查信箱或伺服器連線。');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
      <JwtLoginForm onSubmit={handleEmailSubmit} isLoading={isLoading} error={error} />
    </div>
  );
}
