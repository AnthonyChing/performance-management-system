import { useEffect, useRef, useState } from 'react';
import type { GoogleCredentialResponse } from '../types';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google 登入只能在瀏覽器中使用。'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('無法載入 Google 登入服務，請稍後再試。')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('無法載入 Google 登入服務，請稍後再試。'));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export interface GoogleLoginFormProps {
  clientId: string;
  disabled?: boolean;
  errorMessage?: string | null;
  onCredential: (credential: string) => void;
}

export default function GoogleLoginForm({
  clientId,
  disabled = false,
  errorMessage,
  onCredential,
}: GoogleLoginFormProps) {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      return undefined;
    }

    let isCancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (isCancelled) {
          return;
        }

        const googleIdentity = window.google?.accounts?.id;

        if (!googleIdentity) {
          setServiceMessage('Google 登入服務尚未準備好，請重新整理後再試。');
          return;
        }

        googleIdentity.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            const credential = response.credential?.trim();

            if (!credential) {
              setServiceMessage('Google 沒有回傳登入憑證，請再試一次。');
              return;
            }

            setServiceMessage(null);
            onCredential(credential);
          },
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          googleIdentity.renderButton(buttonContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setServiceMessage(error instanceof Error ? error.message : '無法載入 Google 登入。');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [clientId, onCredential]);

  const visibleMessage =
    errorMessage ??
    serviceMessage ??
    (!clientId ? '尚未設定 VITE_GOOGLE_CLIENT_ID，請先設定 Google OAuth Client ID。' : null);

  return (
    <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-xl font-bold text-slate-900">登入</h1>
      <p className="mb-5 text-sm text-slate-500">
        請使用 Google 帳號登入，系統會向後端交換可存取 PMS API 的授權 token。
      </p>

      <div
        ref={buttonContainerRef}
        aria-busy={disabled}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      />

      {disabled && <p className="mt-3 text-sm font-medium text-slate-600">登入中...</p>}

      {visibleMessage && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {visibleMessage}
        </p>
      )}
    </section>
  );
}
