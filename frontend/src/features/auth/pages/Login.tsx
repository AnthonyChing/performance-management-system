import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ApiRequestError, createGoogleSession } from '../../../api/auth';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

const roleRedirectMap: Record<string, string> = {
  employee: '/dashboard',
  manager: '/dashboard',
  hr: '/hr/cycles',
};

function getGoogleClientId() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_GOOGLE_CLIENT_ID ?? '';
}

function getPrimaryRole(roles: string[]) {
  if (roles.includes('hr')) return 'hr';
  if (roles.includes('manager')) return 'manager';
  return roles[0] ?? 'employee';
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google script failed to load.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed to load.'));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = useMemo(getGoogleClientId, []);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleButtonReady, setIsGoogleButtonReady] = useState(false);

  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const redirectTarget = redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : null;

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setErrorMessage('Google 未回傳登入憑證，請再試一次。');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await createGoogleSession(response.credential);
      const role = getPrimaryRole(data.roles);

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      localStorage.setItem('role', role);

      navigate(redirectTarget ?? roleRedirectMap[role] ?? '/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setErrorMessage('此 Google 帳號尚未被授權登入系統。');
      } else {
        setErrorMessage('Google 登入失敗，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, redirectTarget]);

  useEffect(() => {
    let isCancelled = false;

    if (!googleClientId) {
      setErrorMessage('尚未設定 Google Client ID，請確認 .env 的 VITE_GOOGLE_CLIENT_ID。');
      return;
    }

    setErrorMessage('');
    setIsGoogleButtonReady(false);

    loadGoogleIdentityScript()
      .then(() => {
        if (isCancelled) return;

        const googleAccountsId = window.google?.accounts.id;
        const buttonParent = googleButtonRef.current;

        if (!googleAccountsId || !buttonParent) {
          setErrorMessage('Google 登入元件載入失敗，請重新整理頁面。');
          return;
        }

        googleAccountsId.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          ux_mode: 'popup',
        });

        buttonParent.innerHTML = '';
        googleAccountsId.renderButton(buttonParent, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: `${Math.min(320, buttonParent.clientWidth || 320)}`,
        });
        setIsGoogleButtonReady(true);
      })
      .catch(() => {
        if (!isCancelled) {
          setErrorMessage('無法載入 Google 登入元件，請確認網路連線後重試。');
        }
      });

    return () => {
      isCancelled = true;
      window.google?.accounts.id.disableAutoSelect();
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B2544]">
              <div className="h-4 w-4 rounded-sm border-2 border-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">PerformancePlus</span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10 md:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">登入績效管理系統</h1>
              <p className="mt-2 text-sm text-slate-500">
                請使用已登記的 Google 帳號繼續。
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <ShieldCheck className="h-5 w-5 text-[#0B2544]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Google 登入</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    登入後將依帳號權限進入對應工作區。
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="flex min-h-11 items-center justify-center">
                  <div
                    ref={googleButtonRef}
                    className={`w-full max-w-[320px] ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                  />
                  {!isGoogleButtonReady && googleClientId ? (
                    <div className="text-sm text-slate-500">載入 Google 登入中...</div>
                  ) : null}
                </div>

                {errorMessage ? (
                  <div className="error-message rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {isSubmitting ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
                    正在登入系統...
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              若 Google 帳號無法登入，請確認 HR 已建立相同 email 的使用者。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
