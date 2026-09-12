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
  Library,
  MessageSquareHeart,
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
  onOpenFeedback?: () => void;
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
  onOpenFeedback,
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
    { id: 'materials', label: 'Materials', icon: Library },
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
        className="hidden md:flex w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 z-20 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)] overflow-hidden transition-colors duration-200"
      >
        <div className="flex flex-col p-5 flex-1 overflow-y-auto overscroll-contain">
          {/* Brand Logo */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <button
              id="sidebar-logo-button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="StudyFlow App Icon"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 border border-slate-100 dark:border-slate-800"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                    Study<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase">
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
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-emerald-500/10 dark:from-amber-500/20 dark:via-amber-400/15 dark:to-emerald-500/20 border border-amber-200/80 dark:border-amber-700/60 hover:border-amber-300 dark:hover:border-amber-500 transition-all text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg group-hover:scale-110 transition-transform">🪙</span>
                <div>
                  <div className="text-xs font-extrabold text-amber-950 dark:text-amber-200 leading-tight flex items-center gap-1">
                    <span>{coins}</span>
                    <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">Coins</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Study Store
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-transparent dark:border-emerald-800">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] cursor-pointer"
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100/50 dark:border-indigo-800/60'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.2]' : 'text-slate-400 dark:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800">
                      🌲 {item.badge}
                    </span>
                  )}
                  {item.id === 'store' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-transparent dark:border-amber-800">
                      🪙
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Feedback */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
          {onOpenFeedback && (
            <button
              id="sidebar-give-feedback-button"
              type="button"
              onClick={onOpenFeedback}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
                <span>Give Feedback</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                BETA
              </span>
            </button>
          )}

          <button
            id="sidebar-user-profile-button"
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all duration-150 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-display font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs relative">
              {initials}
              {(profile.role === 'admin' || userEmail?.toLowerCase() === 'mohamedelkoramy97@gmail.com') && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900"
                  title="Administrator"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                  {profile.name}
                </span>
                {(profile.role === 'admin' || userEmail?.toLowerCase() === 'mohamedelkoramy97@gmail.com') && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
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
        className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200"
      >
        <button
          id="mobile-logo-button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="StudyFlow App Icon"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-100 dark:border-slate-800"
          />
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Study<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="mobile-coins-button"
            type="button"
            onClick={() => onNavigate('store')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold"
            title="Open Store"
          >
            <span>🪙</span>
            <span>{coins}</span>
          </button>
          <button
            id="mobile-quick-add-task"
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          {onOpenFeedback && (
            <button
              id="mobile-give-feedback-btn"
              type="button"
              onClick={onOpenFeedback}
              className="p-1.5 text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition-colors cursor-pointer"
              title="Give Feedback"
              aria-label="Give Feedback"
            >
              <MessageSquareHeart className="w-5 h-5" />
            </button>
          )}
          <button
            id="mobile-quick-settings"
            onClick={() => onNavigate('settings')}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center z-40 shadow-lg transition-colors duration-200"
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
