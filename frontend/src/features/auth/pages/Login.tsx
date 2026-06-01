import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthApiError, authenticateWithGoogle } from '../api';
import GoogleLoginForm from '../components/GoogleLoginForm';
import { saveAuthToken } from '../tokenStorage';
import { getGoogleClientId } from '../types';

function normalizeRedirectPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  return redirect;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectPath = useMemo(
    () => normalizeRedirectPath(searchParams.get('redirect')),
    [searchParams],
  );
  const googleClientId = getGoogleClientId();

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const session = await authenticateWithGoogle(idToken);
        if (session.roles && session.roles.length > 0) {
          localStorage.setItem('role', session.roles[0]);
          localStorage.setItem('roles', JSON.stringify(session.roles));
        }
        navigate(redirectPath, { replace: true });
      } catch (error) {
        setErrorMessage(
          error instanceof AuthApiError || error instanceof Error
            ? error.message
            : 'Google 登入失敗，請稍後再試。',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigate, redirectPath],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
      <GoogleLoginForm
        clientId={googleClientId}
        disabled={isSubmitting}
        errorMessage={errorMessage}
        onCredential={handleGoogleCredential}
      />
    </div>
  );
}
