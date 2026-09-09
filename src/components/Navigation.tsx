import {
  LayoutDashboard,
  CheckSquare,
  GraduationCap,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Sparkles,
  Trees,
  ShoppingBag,
} from 'lucide-react';
import { NavScreen, StudentProfile } from '../types';

interface NavigationProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  profile: StudentProfile;
  userEmail?: string;
  onOpenAddTask: () => void;
  treesCount?: number;
  coins?: number;
  onSignOut?: () => void;
}

export function Navigation({
  currentScreen,
  onNavigate,
  profile,
  userEmail,
  onOpenAddTask,
  treesCount = 0,
  coins = 0,
  onSignOut,
}: NavigationProps) {
  const initials = (profile.name || 'Student')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const navItems: {
    id: NavScreen;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'planner', label: 'Planner', icon: Calendar },
    {
      id: 'forest',
      label: 'Forest',
      icon: Trees,
      badge: treesCount > 0 ? `${treesCount}` : undefined,
    },
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar with independent scrolling */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex w-64 flex-col justify-between border-r border-slate-200 bg-white h-screen sticky top-0 z-20 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        <div className="flex flex-col p-5 flex-1 overflow-y-auto overscroll-contain">
          {/* Brand Logo */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 shrink-0">
            <button
              id="sidebar-logo-button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <img
                src="/src/assets/images/studyflow_app_icon_1788959981358.jpg"
                alt="StudyFlow App Icon"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 border border-slate-100"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                    Study<span className="text-indigo-600">Flow</span>
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                  Semester Planner
                </p>
              </div>
            </button>
          </div>

          {/* Study Coins Wallet Widget */}
          <div className="mt-4 mb-1 shrink-0">
            <button
              id="sidebar-coins-widget"
              type="button"
              onClick={() => onNavigate('store')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-emerald-500/10 border border-amber-200/80 hover:border-amber-300 transition-all text-left group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg group-hover:scale-110 transition-transform">🪙</span>
                <div>
                  <div className="text-xs font-extrabold text-amber-950 leading-tight flex items-center gap-1">
                    <span>{coins}</span>
                    <span className="text-[10px] font-semibold text-amber-800">Coins</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Study Store
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <span>Store</span>
                <span>🌲</span>
              </span>
            </button>
          </div>

          {/* Quick Action CTA */}
          <div className="mt-3 mb-3 shrink-0">
            <button
              id="sidebar-add-task-cta"
              onClick={onOpenAddTask}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="mt-1 space-y-1 pb-4" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600 stroke-[2.2]' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      🌲 {item.badge}
                    </span>
                  )}
                  {item.id === 'store' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      🪙
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            id="sidebar-user-profile-button"
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all duration-150 text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-display font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs relative">
              {initials}
              {(profile.role === 'admin' || userEmail?.toLowerCase() === 'mohamedelkoramy97@gmail.com') && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white"
                  title="Administrator"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium text-sm text-slate-800 truncate">
                  {profile.name}
                </span>
                {(profile.role === 'admin' || userEmail?.toLowerCase() === 'mohamedelkoramy97@gmail.com') && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  {userEmail || profile.major || profile.tier}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header
        id="mobile-top-header"
        className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs"
      >
        <button
          id="mobile-logo-button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2"
        >
          <img
            src="/src/assets/images/studyflow_app_icon_1788959981358.jpg"
            alt="StudyFlow App Icon"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-100"
          />
          <span className="font-display font-bold text-lg text-slate-900">
            Study<span className="text-indigo-600">Flow</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="mobile-coins-button"
            type="button"
            onClick={() => onNavigate('store')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
            title="Open Store"
          >
            <span>🪙</span>
            <span>{coins}</span>
          </button>
          <button
            id="mobile-quick-add-task"
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          <button
            id="mobile-quick-settings"
            onClick={() => onNavigate('settings')}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center z-40 shadow-lg"
        aria-label="Mobile Navigation"
      >
        {[
          { id: 'dashboard' as NavScreen, label: 'Home', icon: LayoutDashboard },
          { id: 'tasks' as NavScreen, label: 'Tasks', icon: CheckSquare },
          { id: 'forest' as NavScreen, label: 'Forest', icon: Trees },
          { id: 'planner' as NavScreen, label: 'Planner', icon: Calendar },
          { id: 'courses' as NavScreen, label: 'Courses', icon: GraduationCap },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
