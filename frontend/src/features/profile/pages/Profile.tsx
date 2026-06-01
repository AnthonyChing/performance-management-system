import React, { useEffect, useState } from 'react';
import { Mail, Briefcase, CalendarDays } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ApiRequestError,
  getCurrentPerformanceCycle,
  getMyProfile,
  type CurrentPerformanceCycleResponse,
  type ProfileResponse,
} from '../api';

const statusStyles: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-orange-100 text-orange-700',
  locked: 'bg-amber-100 text-amber-700',
  results_published: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  closed: 'bg-slate-200 text-slate-700',
};

export interface ProfileViewProps {
  profileData: ProfileResponse | null;
  cycleData: CurrentPerformanceCycleResponse | null;
  isProfileLoading: boolean;
  isCycleLoading: boolean;
  profileErrorMessage: string | null;
  cycleErrorMessage: string | null;
  hasCurrentCycle: boolean;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
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
  return t('loadFailed');
}

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 401 &&
    error.code === 'UNAUTHORIZED'
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('profile');
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [cycleData, setCycleData] = useState<CurrentPerformanceCycleResponse | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isCycleLoading, setIsCycleLoading] = useState(true);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);
  const [cycleErrorMessage, setCycleErrorMessage] = useState<string | null>(null);
  const [hasCurrentCycle, setHasCurrentCycle] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const redirectPath = `${location.pathname}${location.search}`;

    function redirectToLogin() {
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }

    async function loadProfile() {
      try {
        const profileResponse = await getMyProfile({ signal: controller.signal });

        if (!isMounted) return;
        setProfileData(profileResponse);
        setProfileErrorMessage(null);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;
        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        setProfileErrorMessage(getApiErrorMessage(error, t));
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    }

    async function loadCurrentCycle() {
      try {
        const cycleResponse = await getCurrentPerformanceCycle({
          signal: controller.signal,
        });

        if (!isMounted) return;
        setCycleData(cycleResponse);
        setCycleErrorMessage(null);
        setHasCurrentCycle(true);
      } catch (error) {
        if (!isMounted || isAbortError(error)) return;

        if (
          error instanceof ApiRequestError &&
          error.status === 404 &&
          error.code === 'CURRENT_CYCLE_NOT_FOUND'
        ) {
          setHasCurrentCycle(false);
          setCycleErrorMessage(null);
        } else {
          if (isUnauthorizedError(error)) {
            redirectToLogin();
            return;
          }

          setCycleErrorMessage(getApiErrorMessage(error, t));
        }
      } finally {
        if (isMounted) {
          setIsCycleLoading(false);
        }
      }
    }

    loadProfile();
    loadCurrentCycle();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, location.search, navigate, t]);

  return (
    <ProfileView
      profileData={profileData}
      cycleData={cycleData}
      isProfileLoading={isProfileLoading}
      isCycleLoading={isCycleLoading}
      profileErrorMessage={profileErrorMessage}
      cycleErrorMessage={cycleErrorMessage}
      hasCurrentCycle={hasCurrentCycle}
    />
  );
}

export function ProfileView({
  profileData,
  cycleData,
  isProfileLoading,
  isCycleLoading,
  profileErrorMessage,
  cycleErrorMessage,
  hasCurrentCycle,
}: ProfileViewProps) {
  const { t } = useTranslation('profile');
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profileData?.profile.avatar_url]);

  if (isProfileLoading) {
    return (
      <div className="w-full max-w-4xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {t('loading')}
        </div>
      </div>
    );
  }

  if (profileErrorMessage || !profileData) {
    return (
      <div className="w-full max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {profileErrorMessage ?? t('loadFailed')}
        </div>
      </div>
    );
  }

  const { profile } = profileData;
  const displayName = profile.english_name
    ? `${profile.name} (${profile.english_name})`
    : profile.name;
  const avatarInitials = profile.english_name
    ? profile.english_name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : profile.name.slice(0, 2);
  const showAvatarImage = Boolean(profile.avatar_url) && !avatarFailed;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-2">{t('subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 flex flex-col md:flex-row md:items-center">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 shadow-sm mr-6">
            {showAvatarImage ? (
              <img
                src={profile.avatar_url ?? ''}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-bold text-slate-500">
                {avatarInitials}
              </div>
            )}
          </div>
          <div className="flex-1 mt-4 md:mt-0">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
              <span className="ml-4 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md flex items-center">
                {t('employeeId', { id: profile.employee_id })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start text-sm text-slate-600">
                <Briefcase className="w-4 h-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">{profile.job_title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{profile.department.name}</p>
                </div>
              </div>
              <div className="flex items-start text-sm text-slate-600">
                <Mail className="w-4 h-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">{profile.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCycleLoading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
          {t('cycleLoading')}
        </div>
      )}

      {!isCycleLoading && !hasCurrentCycle && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
          {t('noCycle')}
        </div>
      )}

      {!isCycleLoading && cycleErrorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {cycleErrorMessage}
        </div>
      )}

      {!isCycleLoading && cycleData && !cycleErrorMessage && (
        <CurrentCycleCard cycle={cycleData.cycle} />
      )}
    </div>
  );
}

export function CurrentCycleCard({
  cycle,
}: {
  cycle: CurrentPerformanceCycleResponse['cycle'];
}) {
  const { t } = useTranslation('profile');
  const statusLabel = t(`cycleStatus.${cycle.status}`, cycle.status);
  const statusClassName = statusStyles[cycle.status] ?? statusStyles.in_progress;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2 mb-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-sm ${statusClassName}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {cycle.name}{' '}
          <span className="font-normal text-slate-600 text-base">
            {t('cyclePeriod', { period: cycle.period_label })}
          </span>
        </h3>
      </div>
      <div className="mt-4 sm:mt-0 text-indigo-800 bg-indigo-50 p-2 rounded-md border border-indigo-100">
        <CalendarDays className="w-5 h-5" />
      </div>
    </div>
  );
}
