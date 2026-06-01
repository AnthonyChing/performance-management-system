import React, { useState } from 'react';
import { AlignLeft, CheckCircle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiRequestError, createMyGoal } from '../api';

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 401 &&
    error.code === 'UNAUTHORIZED'
  );
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 && error.code === 'UNAUTHORIZED') {
      return '尚未登入或 token 失效。';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '目標建立失敗。';
}

export default function NewGoal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(title.trim() && dueDate && description.trim());

  async function handleConfirmSubmit() {
    if (!canSubmit) {
      setErrorMessage('請填寫目標名稱、截止日期與目標說明。');
      setIsModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await createMyGoal({
        title: title.trim(),
        due_date: dueDate,
        description: description.trim(),
      });
      setIsModalOpen(false);
      navigate('/goals/current');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error));
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="w-full max-w-4xl relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">新增個人目標</h1>
        <p className="text-slate-500 text-sm">請定義您的下一階段目標。</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center text-slate-900 font-semibold bg-slate-50/50">
          <AlignLeft className="w-5 h-5 mr-3 text-indigo-600" />
          基本目標資訊
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-slate-700 mb-2">
              目標名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：提升產品技術文件完整度"
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="goal-due-date" className="block text-sm font-medium text-slate-700 mb-2">
              預計達成時間 (截止日期) <span className="text-red-500">*</span>
            </label>
            <input
               id="goal-due-date"
               type="date"
               min="1000-01-01"
               max="9999-12-31"
               value={dueDate}
               onChange={(event) => {
                 const v = event.target.value;
                 if (!v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && parseInt(v.slice(5, 7), 10) <= 12 && parseInt(v.slice(8, 10), 10) <= 31)) {
                   setDueDate(v);
                 }
               }}
               className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-slate-700 mb-2">
              目標說明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full h-40 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm resize-none transition-shadow"
              placeholder="詳細描述此目標的背景、執行方式與預期價值..."
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          onClick={() => navigate('/goals/current')}
          className="px-6 py-2.5 border border-slate-300 rounded-md font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm transition-colors"
        >
          取消建立
        </button>
        <button 
          onClick={() => {
            if (!canSubmit) {
              setErrorMessage('請填寫目標名稱、截止日期與目標說明。');
              return;
            }

            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '提交中...' : '提交並送審'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                確認提交目標審核
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                確定要提交此目標並送出審核嗎？
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                 <span className="font-bold mr-1">注意：</span>
                 送出後將由直屬主管進行審批，審核期間您暫時無法編輯此目標內容。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '確認提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
