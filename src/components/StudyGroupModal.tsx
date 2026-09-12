import React, { useState, useMemo } from 'react';
import { Course, Task } from '../types';
import {
  X,
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface StudyGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  tasks?: Task[];
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'Group Lead' | 'Study Peer';
  syncedAt: string;
  weeklyHoursLogged: number;
  streakDays: number;
  status: 'online' | 'studying' | 'offline';
}

export function StudyGroupModal({
  isOpen,
  onClose,
  course,
  tasks = [],
}: StudyGroupModalProps) {
  const [activeTab, setActiveTab] = useState<'invite' | 'members' | 'join'>('invite');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);

  // Generate deterministic code based on course ID & code
  const invitationCode = useMemo(() => {
    if (!course) return '';
    const cleanCode = course.code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'STUDY';
    // Deterministic 4-char suffix from course ID
    let hash = 0;
    for (let i = 0; i < course.id.length; i++) {
      hash = (hash << 5) - hash + course.id.charCodeAt(i);
      hash |= 0;
    }
    const suffix = Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
    return `${cleanCode}-SYNC-${suffix || '9X42'}`;
  }, [course]);

  const invitationLink = useMemo(() => {
    if (!course) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ai-study.app';
    return `${origin}/join-group?courseId=${course.id}&code=${invitationCode}`;
  }, [course, invitationCode]);

  // Initial group members
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: 'm-1',
      name: 'You (Host)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      role: 'Group Lead',
      syncedAt: 'Just now',
      weeklyHoursLogged: 14.5,
      streakDays: 6,
      status: 'studying',
    },
    {
      id: 'm-2',
      name: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      role: 'Study Peer',
      syncedAt: '12m ago',
      weeklyHoursLogged: 18.2,
      streakDays: 8,
      status: 'online',
    },
    {
      id: 'm-3',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      role: 'Study Peer',
      syncedAt: '2h ago',
      weeklyHoursLogged: 11.0,
      streakDays: 4,
      status: 'offline',
    },
  ]);

  if (!isOpen || !course) return null;

  const courseTasks = tasks.filter((t) => t.courseId === course.id);
  const milestoneCount = courseTasks.filter((t) => t.type === 'Exam' || t.type === 'Quiz' || t.type === 'Project').length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSyncPlan = () => {
    setIsSyncing(true);
    setSyncedSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedSuccess(true);
      setTimeout(() => setSyncedSuccess(false), 4000);
    }, 1200);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    // Simulate joining group
    const newMember: GroupMember = {
      id: `m-${Date.now()}`,
      name: 'Sam Taylor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      role: 'Study Peer',
      syncedAt: 'Just now',
      weeklyHoursLogged: 15.0,
      streakDays: 5,
      status: 'online',
    };

    setMembers((prev) => [...prev, newMember]);
    setJoinSuccessMsg(`Successfully joined group ${joinCodeInput.toUpperCase()}! Study schedule synced.`);
    setJoinCodeInput('');
    setActiveTab('members');
    setTimeout(() => setJoinSuccessMsg(null), 4000);
  };

  return (
    <div
      id="study-group-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="study-group-modal-card"
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4"
      >
        {/* Header with Course Branding */}
        <div
          className="p-6 text-white relative flex flex-col justify-between"
          style={{ backgroundColor: course.accentHex }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 pr-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-white">
              <Users className="w-3.5 h-3.5" />
              <span>Study Group & Schedule Sync</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {course.name}
            </h2>
            <p className="text-xs text-white/90 font-mono font-medium">
              {course.code} • {members.length} Synced Group Members
            </p>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'invite'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite & Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Peers ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'join'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Join Existing Group</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {joinSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{joinSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: INVITATION LINK & CODE */}
          {activeTab === 'invite' && (
            <div className="space-y-6">
              {/* Unique Code Card */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-900 dark:to-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Course Sync Invitation Code
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unique & Secure</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 rounded-xl border border-indigo-200 dark:border-indigo-800 font-mono font-extrabold text-lg sm:text-xl text-indigo-700 dark:text-indigo-300 tracking-wider select-all text-center">
                    {invitationCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Share this code with classmates enrolled in <strong className="text-slate-700 dark:text-slate-200">{course.name}</strong> to automatically sync exam dates, homework deadlines, and study targets.
                </p>
              </div>

              {/* Direct Invitation Link Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Direct Invitation Link
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationLink}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300 truncate focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Sync Plan Action */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Sync Group Study Plan</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Aligns {milestoneCount} major exams/projects and recommended daily focus hours across all {members.length} members.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncPlan}
                    disabled={isSyncing}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Plan Now'}</span>
                  </button>
                </div>

                {syncedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Study plan successfully synced across all {members.length} group members!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GROUP MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Study Group Peers ({members.length})
                </h4>
                <button
                  type="button"
                  onClick={handleSyncPlan}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Status</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            m.status === 'studying'
                              ? 'bg-amber-500 animate-pulse'
                              : m.status === 'online'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {m.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.role === 'Group Lead'
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Synced: {m.syncedAt}</span>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {m.weeklyHoursLogged}h this week
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{m.streakDays}d streak</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('invite')}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite More Peers</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: JOIN EXISTING GROUP VIA CODE */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Enter Peer Invitation Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. CS101-SYNC-9X42"
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!joinCodeInput.trim()}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <span>Join & Sync</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Joining a classmate's group syncs your shared course deadlines and enables study milestone tracking.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Course Study Sync Protocol v2.4</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
