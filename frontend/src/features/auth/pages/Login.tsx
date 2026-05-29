import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { ApiRequestError, createSession } from '../../../api/auth';

const roleRedirectMap: Record<string, string> = {
  employee: '/dashboard',
  manager: '/dashboard',
  hr: '/hr/cycles',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const redirectTarget = redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setErrorMessage('請輸入帳號與密碼。');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await createSession({ username, password });
      const token = data.token;
      const role = data.role ?? 'employee';

      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('role', role);

      navigate(redirectTarget ?? roleRedirectMap[role] ?? '/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setErrorMessage('帳號或密碼錯誤，請重新輸入。');
      } else {
        setErrorMessage('登入失敗，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200">
            PerformancePlus
            <span className="h-[1px] flex-1 bg-emerald-200/40" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight">
            績效管理平台登入
          </h1>
          <p className="mt-4 text-white/70">
            集中管理個人績效、主管審核與 HR 範本設定，保持每一次評估透明一致。
          </p>

          <div className="mt-10 grid gap-5 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">01</span>
              即時追蹤 KPI 與目標進度
            </div>
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">02</span>
              一站式管理評核週期與模板
            </div>
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">03</span>
              透明化異議與稽核紀錄流程
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold">登入帳號</h2>
          <p className="mt-2 text-sm text-white/60">
            請使用公司指派的帳號密碼登入。
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm">
              帳號
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-emerald-400">
                <Mail className="h-4 w-4 text-white/60" />
                <input
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="example@company.com"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              密碼
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-emerald-400">
                <Lock className="h-4 w-4 text-white/60" />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </label>

            {errorMessage ? (
              <div className="error-message rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? '登入中...' : '登入系統'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 text-xs text-white/50">
            若忘記密碼，請聯絡系統管理員重置。
          </div>
        </div>
      </div>
    </div>
  );
}
