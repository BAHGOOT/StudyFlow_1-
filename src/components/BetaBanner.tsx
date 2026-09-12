import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquareHeart, X } from 'lucide-react';

interface BetaBannerProps {
  onOpenFeedback: () => void;
}

const STORAGE_KEY = 'studyflow_beta_banner_dismissed_v1';

export const BetaBanner: React.FC<BetaBannerProps> = ({ onOpenFeedback }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // start hidden to avoid layout shift

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div
      id="studyflow-beta-banner"
      className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white shadow-md border-b border-indigo-700/40 backdrop-blur-md transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm font-medium">
        {/* Left Side: Badge + Announcement Message */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <span
            id="beta-badge-pill"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs shrink-0"
          >
            <Sparkles className="w-3 h-3 fill-slate-950" />
            BETA
          </span>
          <p className="text-slate-100 font-medium leading-tight">
            🚀 Welcome to StudyFlow Beta! All AI features &amp; Course Hubs are <span className="text-amber-300 font-bold">100% FREE</span> during public beta.
          </p>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="beta-give-feedback-btn"
            type="button"
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-pink-300" />
            <span>Give Feedback</span>
          </button>

          <button
            id="beta-dismiss-banner-btn"
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
