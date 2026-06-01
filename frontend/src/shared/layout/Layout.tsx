import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { User, LineChart, FileWarning, Target, Settings, HelpCircle, ChevronDown, ChevronRight, Users, ClipboardList, Menu, LogOut, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { deleteSession } from '../../api/auth';
import { getMyProfile, type EmployeeProfile } from '../../api/employee';
import { getUserRoles } from '../../features/auth';

const SidebarItem = ({ to, icon: Icon, label, exact, isSidebarOpen, isGroupStyle }: any) => {
  return (
    <div className={isGroupStyle ? "py-1" : "py-2"}>
      <NavLink
        to={to}
        end={exact}
        className={({ isActive }) =>
          `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            isGroupStyle ? 'font-semibold' : 'font-medium'
          } ${
            isActive
              ? 'text-[#0B2544] bg-slate-100 border-r-2 border-[#0B2544]'
              : `hover:bg-slate-50 ${isGroupStyle ? 'text-slate-900' : 'text-slate-600'}`
          } ${!isSidebarOpen && isGroupStyle ? 'justify-center' : ''}`
        }
        title={!isSidebarOpen ? label : ""}
      >
        {({ isActive }) => (
          <>
            <Icon className={`w-4 h-4 shrink-0 ${isSidebarOpen ? 'mr-3' : (!isGroupStyle ? 'mx-auto' : '')} ${isActive ? 'text-[#0B2544]' : (isGroupStyle ? 'text-slate-400' : '')}`} />
            {isSidebarOpen && <span className={isGroupStyle ? "flex-1 truncate" : "truncate"}>{label}</span>}
          </>
        )}
      </NavLink>
    </div>
  );
};

const SidebarGroup = ({ icon: Icon, label, children, basePath, isSidebarOpen }: any) => {
  const location = useLocation();
  const isActiveGroup = location.pathname.startsWith(basePath);
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setIsOpen(true);
  }, [isActiveGroup, location.pathname]);

  return (
    <div className="space-y-1 py-1">
      <div
        onClick={() => {
          if (isSidebarOpen) {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center px-3 py-2 text-sm font-semibold cursor-pointer rounded-md transition-colors ${!isSidebarOpen ? 'justify-center hover:bg-slate-50' : 'hover:bg-slate-50 text-slate-900'} ${isActiveGroup && !isSidebarOpen ? 'bg-slate-100 text-[#0B2544]' : ''}`}
        title={!isSidebarOpen ? label : ""}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActiveGroup ? 'text-[#0B2544]' : 'text-slate-400'} ${isSidebarOpen ? 'mr-3' : ''}`} />
        {isSidebarOpen && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </div>
      {isSidebarOpen && isOpen && (
        <div className="ml-7 space-y-1 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

const SidebarSubItem = ({ to, label }: any) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 text-sm rounded-md transition-colors truncate ${
          isActive
            ? 'font-medium text-[#0B2544] bg-slate-100 border-r-2 border-[#0B2544]'
            : 'text-slate-500 hover:text-slate-900'
        }`
      }
    >
      {label}
    </NavLink>
  );
};

function getDisplayName(profile: EmployeeProfile | null, defaultName: string) {
  if (!profile) {
    return defaultName;
  }

  return profile.english_name ? `${profile.name} ${profile.english_name}` : profile.name;
}

function getAvatarInitials(profile: EmployeeProfile | null) {
  if (!profile) {
    return <User className="w-5 h-5" />;
  }

  if (profile.english_name) {
    const initials = profile.english_name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (initials) {
      return initials;
    }
  }

  return profile.name.slice(0, 2);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('layout');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<EmployeeProfile | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const roles = getUserRoles();
  const isManager = roles.some(r => r.toLowerCase() === 'manager');
  const isHr = roles.some(r => r.toLowerCase() === 'hr');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    getMyProfile({ signal: controller.signal })
      .then((response) => {
        if (!isMounted) return;
        setCurrentUser(response.profile);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setAvatarFailed(false);
  }, [currentUser?.avatar_url]);

  const handleLogout = async () => {
    try {
      await deleteSession();
    } catch (error) {
      // Ignore logout errors; local cleanup still happens.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login', { replace: true });
    }
  };

  function toggleLanguage() {
    const next = i18n.language === 'zh-TW' ? 'en' : 'zh-TW';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  }

  const getBreadcrumbs = () => {
    const path = location.pathname;

    const BreadcrumbItem: React.FC<{ label: string; isLast?: boolean; key?: React.Key }> = ({ label, isLast }) => (
      <div className={`flex items-center ${isLast ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
        {label}
        {!isLast && <ChevronRight className="w-5 h-5 mx-2 text-slate-400" />}
      </div>
    );

    const BreadcrumbList = ({ items }: { items: string[] }) => (
      <div className="flex items-center text-lg">
        {items.map((item, idx) => (
          <BreadcrumbItem key={item} label={item} isLast={idx === items.length - 1} />
        ))}
      </div>
    );

    if (path === '/') return <BreadcrumbList items={[t('breadcrumb.myProfile')]} />;

    // Performance
    if (path.startsWith('/performance/current')) return <BreadcrumbList items={[t('breadcrumb.performance'), t('breadcrumb.currentKpi')]} />;
    if (path.startsWith('/performance/history/')) return <BreadcrumbList items={[t('breadcrumb.performance'), t('breadcrumb.historyKpi'), t('breadcrumb.historyKpiDetail')]} />;
    if (path.startsWith('/performance/history')) return <BreadcrumbList items={[t('breadcrumb.performance'), t('breadcrumb.historyKpi')]} />;

    // Dispute
    if (path.startsWith('/dispute')) return <BreadcrumbList items={[t('breadcrumb.performance'), t('breadcrumb.dispute')]} />;

    // Goals - New / Edit
    if (path.startsWith('/goals/new')) return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.currentGoals'), t('breadcrumb.newGoal')]} />;
    if (path.startsWith('/goals/edit')) return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.currentGoals'), t('breadcrumb.editGoal')]} />;

    // Goals - Current
    if (path.startsWith('/goals/current')) return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.currentGoals')]} />;

    // Goals - History
    if (path.startsWith('/goals/history')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 4) return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.historyGoals'), t('breadcrumb.historyGoalsPeriod'), t('breadcrumb.historyGoalsDetail')]} />;
      if (parts.length === 3) return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.historyGoals'), t('breadcrumb.historyGoalsPeriod')]} />;
      return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.historyGoals')]} />;
    }

    // Goals - Detail
    if (path.startsWith('/goals/')) {
        return <BreadcrumbList items={[t('breadcrumb.goals'), t('breadcrumb.currentGoals'), t('breadcrumb.goalDetail')]} />;
    }

    // Manager
    if (path.startsWith('/manager/overview')) return <BreadcrumbList items={['主管專區', '總覽']} />;
    if (path.startsWith('/manager/goals')) return <BreadcrumbList items={['主管專區', '目標 / KPI 管理']} />;
    if (path.startsWith('/manager/evaluations')) return <BreadcrumbList items={['主管專區', '團隊績效評估']} />;
    if (path.startsWith('/manager/history')) return <BreadcrumbList items={['主管專區', '歷史紀錄']} />;
    if (path.startsWith('/manager/dispute')) return <BreadcrumbList items={['主管專區', '績效異議']} />;

    // HR
    if (path === '/hr/templates/new') return <BreadcrumbList items={['HR 專區', '考核模板', '新增模板']} />;
    if (path.startsWith('/hr/cycles/new')) return <BreadcrumbList items={['HR 專區', '考核週期', '新增考核週期']} />;
    if (path.startsWith('/hr/cycles/') && path !== '/hr/cycles/new') return <BreadcrumbList items={['HR 專區', '考核週期', '考核週期詳情']} />;
    if (path.startsWith('/hr/cycles')) return <BreadcrumbList items={['HR 專區', '考核週期']} />;
    if (path.startsWith('/hr/templates/')) return <BreadcrumbList items={['HR 專區', '考核模板', '模板詳情']} />;
    if (path.startsWith('/hr/templates')) return <BreadcrumbList items={['HR 專區', '考核模板']} />;
    if (path === '/hr/questionnaires/new') return <BreadcrumbList items={['HR 專區', '問卷模板', '新增問卷']} />;
    if (path.includes('/edit') && path.includes('/hr/questionnaires/')) return <BreadcrumbList items={['HR 專區', '問卷模板', '編輯問卷模板']} />;
    if (path.startsWith('/hr/questionnaires/') && path !== '/hr/questionnaires/new') return <BreadcrumbList items={['HR 專區', '問卷模板', '瀏覽問卷模板']} />;
    if (path.startsWith('/hr/questionnaires')) return <BreadcrumbList items={['HR 專區', '問卷模板']} />;
    if (path.startsWith('/hr/publish')) return <BreadcrumbList items={['HR 專區', '發佈考核結果']} />;
    if (path.startsWith('/hr/audit')) return <BreadcrumbList items={['HR 專區', '查詢稽核紀錄']} />;

    return <BreadcrumbList items={['系統']} />;
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-60' : 'w-20'} h-full bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 transition-all duration-300`}>
        <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} border-b border-slate-100 flex-shrink-0`}>
          <div className="w-8 h-8 bg-[#0B2544] rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          {isSidebarOpen && <span className="font-bold text-slate-800 tracking-tight text-lg truncate">{t('systemName')}</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <SidebarItem to="/" exact icon={User} label={t('nav.myProfile')} isSidebarOpen={isSidebarOpen} isGroupStyle={true} />

          <SidebarGroup icon={LineChart} label={t('nav.performance')} basePath="/performance" isSidebarOpen={isSidebarOpen}>
            <SidebarSubItem to="/performance/current" label={t('nav.currentKpi')} />
            <SidebarSubItem to="/performance/history" label={t('nav.historyKpi')} />
          </SidebarGroup>

          <SidebarItem to="/dispute" icon={FileWarning} label={t('nav.dispute')} isSidebarOpen={isSidebarOpen} isGroupStyle={true} />

          <SidebarGroup icon={Target} label={t('nav.goals')} basePath="/goals" isSidebarOpen={isSidebarOpen}>
            <SidebarSubItem to="/goals/current" label={t('nav.currentGoals')} />
            <SidebarSubItem to="/goals/history" label={t('nav.historyGoals')} />
          </SidebarGroup>

          {isManager && (
            <SidebarGroup icon={ClipboardList} label="主管專區" basePath="/manager" isSidebarOpen={isSidebarOpen}>
              <SidebarSubItem to="/manager/overview" label="總覽" />
              <SidebarSubItem to="/manager/goals" label="目標 / KPI 管理" />
              <SidebarSubItem to="/manager/evaluations" label="團隊績效評估" />
              <SidebarSubItem to="/manager/history" label="歷史紀錄" />
              <SidebarSubItem to="/manager/dispute" label="績效異議" />
            </SidebarGroup>
          )}

          {isHr && (
            <SidebarGroup icon={Users} label="HR 專區" basePath="/hr" isSidebarOpen={isSidebarOpen}>
              <SidebarSubItem to="/hr/cycles" label="考核週期" />
              <SidebarSubItem to="/hr/questionnaires" label="問卷模板" />
              <SidebarSubItem to="/hr/templates" label="考核模板" />
              <SidebarSubItem to="/hr/publish" label="發佈考核結果" />
              <SidebarSubItem to="/hr/audit" label="查詢稽核紀錄" />
            </SidebarGroup>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100 flex flex-col space-y-2 shrink-0">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3 mb-2' : 'justify-center mb-4'}`}>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden font-bold text-slate-600 shrink-0">
              {currentUser?.avatar_url && !avatarFailed ? (
                <img
                  src={currentUser.avatar_url}
                  alt={getDisplayName(currentUser, t('user.defaultName'))}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                getAvatarInitials(currentUser)
              )}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{getDisplayName(currentUser, t('user.defaultName'))}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.job_title ?? t('user.loading')}
                </p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <>
              <button className="flex items-center text-sm text-slate-500 hover:text-slate-800 px-2 py-1">
                <Settings className="w-4 h-4 mr-3" /> Settings
              </button>
              <button className="flex items-center text-sm text-slate-500 hover:text-slate-800 px-2 py-1">
                <HelpCircle className="w-4 h-4 mr-3" /> Help
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-slate-500 hover:text-rose-600 px-2 py-1"
              >
                <LogOut className="w-4 h-4 mr-3" /> Log out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {getBreadcrumbs()}
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            title="Switch language"
          >
            <Globe className="w-3.5 h-3.5" />
            {t('languageSwitch')}
          </button>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
