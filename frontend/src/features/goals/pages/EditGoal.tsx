import React, { useEffect, useState } from 'react';
import { AlignLeft, CheckCircle, MessageSquare, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ApiRequestError,
  getMyCurrentGoals,
  resubmitMyGoal,
  type EmployeeGoal,
} from '../api';

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 401 &&
    error.code === 'UNAUTHORIZED'
  );
}

function getApiErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 && error.code === 'UNAUTHORIZED') {
      return t('unauthorized');
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return t('editGoal.loadFailed');
}

function canEditGoal(goal: EmployeeGoal | null) {
  return Boolean(goal?.available_actions?.can_edit) || goal?.status === 'revision_requested';
}

export default function EditGoal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('goals');
  const [goal, setGoal] = useState<EmployeeGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(
    goal &&
    canEditGoal(goal) &&
    title.trim() &&
    dueDate &&
    description.trim(),
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadGoal() {
      if (!id) {
        setIsLoading(false);
        setErrorMessage(t('editGoal.notFound'));
        return;
      }

      try {
        const response = await getMyCurrentGoals({ signal: controller.signal });
        const matchedGoal = response.goals.find((item) => item.goal_id === id) ?? null;

        if (!isMounted) return;

        if (!matchedGoal) {
          setGoal(null);
          setErrorMessage(t('editGoal.notFound'));
          return;
        }

        setGoal(matchedGoal);
        setTitle(matchedGoal.title);
        setDueDate(matchedGoal.due_date ?? '');
        setDescription(matchedGoal.description ?? '');
        setErrorMessage(
          canEditGoal(matchedGoal)
            ? null
            : t('editGoal.notEditable'),
        );
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (isUnauthorizedError(error)) {
          const redirectPath = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
          return;
        }

        setErrorMessage(getApiErrorMessage(error, t));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGoal();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, location.pathname, location.search, navigate, t]);

  async function handleConfirmSubmit() {
    if (!id || !canSubmit) {
      setErrorMessage(t('editGoal.fillRequired'));
      setIsModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const response = await resubmitMyGoal(id, {
        title: title.trim(),
        due_date: dueDate,
        description: description.trim(),
      });
      setIsModalOpen(false);
      navigate(`/goals/${response.goal.goal_id}`, { replace: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const redirectPath = `${location.pathname}${location.search}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error, t));
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">{t('editGoal.loading')}</div>;
  }

  const latestReview = goal?.latest_review;
  const reviewer = latestReview?.reviewer ?? goal?.reviewer;

  return (
    <div className="w-full max-w-4xl relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">{t('editGoal.title')}</h1>
        <p className="text-slate-500 text-sm">{t('editGoal.subtitle')}</p>
      </div>

      {latestReview && (
        <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden mb-6 p-5">
          <div className="flex items-center text-slate-800 font-bold mb-3">
            <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
            {t('editGoal.managerSuggestion')}
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-orange-950">
                {reviewer?.name ?? t('editGoal.managerFallback')}{reviewer?.title ? ` (${reviewer.title})` : ''}
              </span>
              <span className="text-xs text-orange-700 font-medium">
                {latestReview.reviewed_at ?? '-'}
              </span>
            </div>
            <p className="text-sm text-orange-950 leading-relaxed">
              {latestReview.comment ?? t('editGoal.managerNoComment')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center text-slate-900 font-semibold bg-slate-50/50">
          <AlignLeft className="w-5 h-5 mr-3 text-indigo-600" />
          {t('editGoal.formSection')}
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-slate-700 mb-2">
              {t('editGoal.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!goal || !canEditGoal(goal) || isSubmitting}
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="goal-due-date" className="block text-sm font-medium text-slate-700 mb-2">
              {t('editGoal.dueDateLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-due-date"
              type="date"
              min="1000-01-01"
              max="9999-12-31"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={!goal || !canEditGoal(goal) || isSubmitting}
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-slate-700 mb-2">
              {t('editGoal.descriptionLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!goal || !canEditGoal(goal) || isSubmitting}
              className="w-full h-40 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm resize-none transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
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
          onClick={() => navigate(goal ? `/goals/${goal.goal_id}` : '/goals/current')}
          disabled={isSubmitting}
          className="px-6 py-2.5 border border-slate-300 rounded-md font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('editGoal.cancelEdit')}
        </button>
        <button
          onClick={() => {
            if (!canSubmit) {
              setErrorMessage(
                canEditGoal(goal)
                  ? t('editGoal.fillRequired')
                  : t('editGoal.notEditable'),
              );
              return;
            }

            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          disabled={isSubmitting || !goal || !canEditGoal(goal)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t('editGoal.submitting') : t('editGoal.submitAndReview')}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                {t('editGoal.modal.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t('editGoal.modal.body')}
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                <span className="font-bold mr-1">{t('editGoal.modal.warningLabel')}</span>
                {t('editGoal.modal.warning')}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('editGoal.modal.cancel')}
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? t('editGoal.modal.submitting') : t('editGoal.modal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
