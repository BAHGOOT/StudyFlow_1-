import { useState } from 'react';
import { StudyAvailability, StudentProfile } from '../types';
import {
  Clock,
  Sun,
  Sunset,
  Moon,
  User,
  Bell,
  Palette,
  LogOut,
  RotateCcw,
  Sparkles,
  Check,
  ShieldCheck,
  Database,
  KeyRound,
  Cpu,
} from 'lucide-react';

interface SettingsProps {
  availability: StudyAvailability;
  profile: StudentProfile;
  userEmail?: string;
  onUpdateAvailability: (newAvailability: StudyAvailability) => void;
  onUpdateProfile: (newProfile: StudentProfile) => void;
  onClearData?: () => void;
  onLoadSampleData?: () => void;
  onResetData?: () => void;
  onSignOut?: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function Settings({
  availability,
  profile,
  userEmail,
  onUpdateAvailability,
  onUpdateProfile,
  onClearData,
  onLoadSampleData,
  onResetData,
  onSignOut,
}: SettingsProps) {
  const [currentAvailability, setCurrentAvailability] = useState<StudyAvailability>(availability);
  const [currentProfile, setCurrentProfile] = useState<StudentProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  const handleHourChange = (day: keyof StudyAvailability['dailyHours'], hours: number) => {
    const updated = {
      ...currentAvailability,
      dailyHours: {
        ...currentAvailability.dailyHours,
        [day]: Math.max(0, Math.min(12, hours)),
      },
    };
    setCurrentAvailability(updated);
    onUpdateAvailability(updated);
    flashSaved();
  };

  const handlePreferredTime = (time: 'Morning' | 'Afternoon' | 'Evening') => {
    const updated = { ...currentAvailability, preferredTime: time };
    setCurrentAvailability(updated);
    onUpdateAvailability(updated);
    flashSaved();
  };

  const flashSaved = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalWeeklyHours = (Object.values(currentAvailability.dailyHours) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div id="settings-page" className="space-y-8 pb-20 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure your daily study capacity, preferred study windows, and academic profile.
          </p>
        </div>
        {isSaved && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDY AVAILABILITY SECTION (From prompt)                               */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Study availability</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How much time can you study? StudyFlow distributes your semester tasks to fit this schedule.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Total: {totalWeeklyHours}h / week</span>
          </div>
        </div>

        {/* Daily Sliders / Steppers */}
        <div className="space-y-4">
          {DAYS.map((day) => {
            const hours = currentAvailability.dailyHours[day];
            return (
              <div
                key={day}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <span className="font-semibold text-sm text-slate-800 w-28">{day}:</span>

                <div className="flex-1 max-w-xs mx-4">
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={hours}
                    onChange={(e) => handleHourChange(day, parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-20 justify-end font-mono">
                  <span className="text-sm font-bold text-slate-900">{hours}h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preferred Study Hours */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
            Preferred study hours
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'Morning', label: 'Morning', sub: '08:00 – 12:00', icon: Sun },
              { id: 'Afternoon', label: 'Afternoon', sub: '12:00 – 17:00', icon: Sunset },
              { id: 'Evening', label: 'Evening', sub: '17:00 – 22:00', icon: Moon },
            ].map((slot) => {
              const Icon = slot.icon;
              const isSelected = currentAvailability.preferredTime === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handlePreferredTime(slot.id as any)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${
                      isSelected ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <span
                      className={`text-sm font-bold block ${
                        isSelected ? 'text-indigo-900' : 'text-slate-800'
                      }`}
                    >
                      {slot.label}
                    </span>
                    <span className="text-xs text-slate-500">{slot.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STUDENT ACCOUNT                                                        */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-slate-500" />
          <h2 className="font-display font-bold text-lg text-slate-900">Account</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={currentProfile.name}
              onChange={(e) => {
                const p = { ...currentProfile, name: e.target.value };
                setCurrentProfile(p);
                onUpdateProfile(p);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Academic Major
            </label>
            <input
              type="text"
              value={currentProfile.major}
              onChange={(e) => {
                const p = { ...currentProfile, major: e.target.value };
                setCurrentProfile(p);
                onUpdateProfile(p);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Semester
            </label>
            <input
              type="text"
              value={currentProfile.semester}
              onChange={(e) => {
                const p = { ...currentProfile, semester: e.target.value };
                setCurrentProfile(p);
                onUpdateProfile(p);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Account Email
            </label>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium truncate">
              <span className="truncate">{userEmail || 'student@university.edu'}</span>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold shrink-0 ml-2">
                Cloud Sync
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Current Plan
            </label>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold">
              <span>{currentProfile.tier}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS & THEME                                                  */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bell className="w-5 h-5 text-slate-500" />
          <h2 className="font-display font-bold text-lg text-slate-900">Notifications & Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Morning Study Briefing
              </span>
              <span className="text-xs text-slate-500">
                Receive today's optimal study schedule at 08:00 AM
              </span>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Urgent Deadline Warnings
              </span>
              <span className="text-xs text-slate-500">
                Alert when a high-weight task is within 24 hours
              </span>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
          </label>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ADMINISTRATOR CONTROL PANEL (When user is admin)                       */}
      {/* ========================================================================= */}
      {(profile.role === 'admin' || userEmail?.toLowerCase() === 'mohamedelkoramy97@gmail.com') && (
        <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-white">
                    Administrator Control Center
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Authenticated Super Administrator: <span className="text-amber-300 font-mono">{userEmail || 'mohamedelkoramy97@gmail.com'}</span>
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Rules & DB Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-200 uppercase tracking-wider">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Firestore Cloud Integration</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono truncate">
                Database: ai-studio-studyflow-15155819-8288-4902-b266-160fbe30f763
              </p>
              <div className="text-[11px] text-slate-400">
                Full root &amp; subcollection read/write permissions authorized in <span className="font-mono text-slate-300">firestore.rules</span>.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Admin Privileges</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Multi-User Account Provisioning &amp; Isolation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini AI Timetable Multimodal Parsing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>One-Click Academic Demo Seeding</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            {onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Full Demo Catalog</span>
              </button>
            )}

            {onClearData && (
              <button
                type="button"
                onClick={onClearData}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Wipe Workspace To Clean State</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Workspace Data Controls / Sign out */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {onClearData && (
            <button
              type="button"
              onClick={onClearData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Clear All My Data</span>
            </button>
          )}

          {onLoadSampleData && (
            <button
              type="button"
              onClick={onLoadSampleData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Load Sample Demo Data</span>
            </button>
          )}

          {onResetData && !onClearData && !onLoadSampleData && (
            <button
              type="button"
              onClick={onResetData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sample Data</span>
            </button>
          )}
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out ({userEmail || 'Account'})</span>
          </button>
        )}
      </div>
    </div>
  );
}
