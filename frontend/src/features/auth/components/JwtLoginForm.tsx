import React, { useState } from 'react';

export interface JwtLoginFormProps {
  onSubmit: (token: string) => void;
}

export default function JwtLoginForm({ onSubmit }: JwtLoginFormProps) {
  const [token, setToken] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      setValidationMessage('請貼上 JWT 後再繼續。');
      return;
    }

    setValidationMessage(null);
    onSubmit(trimmedToken);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h1 className="mb-2 text-xl font-bold text-slate-900">登入</h1>
      <p className="mb-5 text-sm text-slate-500">
        請貼上本機開發用 JWT，前端會以 Bearer token 呼叫同網域 API。
      </p>
      <label htmlFor="jwt-token" className="mb-2 block text-sm font-semibold text-slate-700">
        JWT
      </label>
      <textarea
        id="jwt-token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        className="min-h-32 w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
        placeholder="eyJhbGciOiJIUzI1NiJ9..."
      />
      {validationMessage && (
        <p className="mt-2 text-sm font-medium text-red-700">{validationMessage}</p>
      )}
      <button
        type="submit"
        className="mt-4 rounded-md bg-[#0B2544] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#16385f]"
      >
        儲存並繼續
      </button>
    </form>
  );
}
