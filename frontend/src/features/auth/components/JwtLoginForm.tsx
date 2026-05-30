import React, { useState } from 'react';

export interface JwtLoginFormProps {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function JwtLoginForm({ onSubmit, isLoading, error }: JwtLoginFormProps) {
  const [email, setEmail] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h1 className="mb-2 text-xl font-bold text-slate-900">登入系統</h1>
      <p className="mb-5 text-sm text-slate-500">
        請輸入您的測試信箱來登入。
      </p>
      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
        Email
      </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isLoading}
        className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
        placeholder="mandy.ma@acme.test"
      />
      {error && (
        <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="mt-4 w-full rounded-md bg-[#0B2544] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#16385f] disabled:opacity-50"
      >
        {isLoading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}
