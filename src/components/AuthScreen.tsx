import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  BookOpen,
  Building,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const { signInWithGoogle, signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [university, setUniversity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      console.warn('Google sign-in error:', err);
      if (errorObj.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (errorObj.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (errorObj.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by browser. Please allow popups for this site.');
      } else {
        setError(errorObj.message || 'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        if (!displayName.trim()) {
          setError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }
        await signUp(email.trim(), password, displayName.trim(), major.trim(), university.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      console.error('Authentication error:', err);
      if (errorObj.code === 'auth/invalid-credential' || errorObj.code === 'auth/user-not-found' || errorObj.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please check your credentials or create a new account.');
      } else if (errorObj.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorObj.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (errorObj.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(errorObj.message || 'An authentication error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoPass: string, demoName: string, demoMajor: string, demoUni: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Try sign in first with demo flag
      await signIn(demoEmail, demoPass, true);
    } catch {
      try {
        // If not existing, create demo user with demo flag
        await signUp(demoEmail, demoPass, demoName, demoMajor, demoUni, true);
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        setError(errorObj.message || 'Failed to initialize demo account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500/15">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg shadow-indigo-600/20 mb-4 ring-4 ring-indigo-100 overflow-hidden bg-white">
          <img
            src="/src/assets/images/studyflow_app_icon_1788959981358.jpg"
            alt="StudyFlow App Icon"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          StudyFlow
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Smart semester planner & workload management for college students
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-slate-200">
          {/* Google Sign-In Primary Action */}
          <button
            type="button"
            id="google-signin-button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full mb-6 flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-all hover:border-slate-400 disabled:opacity-60 cursor-pointer group"
          >
            {isGoogleSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
            )}
            <span>{isGoogleSubmitting ? 'Signing in with Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or with email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegistering
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegistering
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {isRegistering && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Major
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    University
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="e.g. State University"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? 'Create Student Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-3 text-center">
              Or explore with one-click student profiles:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleDemoSignIn(
                    'alex.engineering@studyflow.edu',
                    'alex123456',
                    'Alex Rivera',
                    'Electrical & Computer Engineering',
                    'Polytechnic Institute'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Alex (Engineering)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  alex.engineering@studyflow.edu
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDemoSignIn(
                    'sarah.biology@studyflow.edu',
                    'sarah123456',
                    'Sarah Chen',
                    'Molecular Biology & Pre-Med',
                    'University of Science'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-200 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sarah (Pre-Med)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  sarah.biology@studyflow.edu
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Each student's workload, schedule, and forest are privately isolated</span>
        </div>
      </div>
    </div>
  );
};
