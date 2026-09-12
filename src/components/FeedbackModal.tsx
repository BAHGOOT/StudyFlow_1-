import React, { useState } from 'react';
import {
  X,
  Star,
  MessageSquareHeart,
  Send,
  Loader2,
  Sparkles,
  Bug,
  Lightbulb,
  HeartHandshake,
} from 'lucide-react';
import { FeedbackType, UserFeedback } from '../types';
import { submitFeedbackToDb } from '../services/firestoreService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccessToast: (msg: string) => void;
}

const FEEDBACK_TYPES: { type: FeedbackType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    type: 'Feature Request',
    label: 'Feature Request',
    icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
    desc: 'Suggest new features or improvements',
  },
  {
    type: 'Bug Report',
    label: 'Bug Report',
    icon: <Bug className="w-4 h-4 text-rose-500" />,
    desc: 'Report something that is not working',
  },
  {
    type: 'General Thoughts',
    label: 'General Thoughts',
    icon: <HeartHandshake className="w-4 h-4 text-indigo-500" />,
    desc: 'Share overall experience and feedback',
  },
];

const RATING_EMOJIS = [
  { rating: 1, label: 'Needs Work', emoji: '😞' },
  { rating: 2, label: 'Fair', emoji: '😐' },
  { rating: 3, label: 'Good', emoji: '🙂' },
  { rating: 4, label: 'Great', emoji: '😃' },
  { rating: 5, label: 'Loved It!', emoji: '🤩' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSuccessToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('General Thoughts');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter a brief message describing your thoughts or request.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const feedbackPayload: UserFeedback = {
        id: feedbackId,
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous@studyflow.app',
        rating,
        type: feedbackType,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      await submitFeedbackToDb(feedbackPayload);

      onSuccessToast('🎉 Thank you for your feedback! It helps make StudyFlow better.');
      setMessage('');
      setRating(5);
      setFeedbackType('General Thoughts');
      onClose();
    } catch (err: unknown) {
      console.error('Error submitting feedback:', err);
      setErrorMsg('Could not submit feedback at this time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayRating = hoverRating ?? rating;
  const currentRatingMeta = RATING_EMOJIS.find((r) => r.rating === currentDisplayRating) || RATING_EMOJIS[4];

  return (
    <div
      id="feedback-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="feedback-modal-container"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {/* Header with decorative gradient banner */}
        <div className="relative p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
          <button
            id="feedback-modal-close-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer disabled:opacity-50"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <MessageSquareHeart className="w-6 h-6 text-pink-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="feedback-modal-title" className="text-xl font-bold font-display tracking-tight text-white">
                  Send Us Feedback
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  BETA
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Help us shape the future of StudyFlow during public beta!
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div
              id="feedback-error-banner"
              className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold"
            >
              {errorMsg}
            </div>
          )}

          {/* Satisfaction / Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                How is your experience with StudyFlow?
              </label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span>{currentRatingMeta.emoji}</span>
                <span>{currentRatingMeta.label}</span>
              </span>
            </div>

            <div
              id="feedback-star-ratings"
              className="flex items-center justify-center gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isSelected = starVal <= (hoverRating ?? rating);
                return (
                  <button
                    key={starVal}
                    id={`feedback-star-${starVal}`}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1.5 rounded-xl hover:scale-115 active:scale-95 transition-all cursor-pointer group"
                    title={`${starVal} star${starVal > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors duration-150 ${
                        isSelected
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                          : 'text-slate-300 dark:text-slate-600 group-hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Type Selector */}
          <div className="space-y-2">
            <label
              htmlFor="feedback-type-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Feedback Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map((ft) => {
                const isSelected = feedbackType === ft.type;
                return (
                  <button
                    key={ft.type}
                    id={`feedback-type-btn-${ft.type.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => setFeedbackType(ft.type)}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {ft.icon}
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-indigo-950 dark:text-indigo-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {ft.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-message-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Your Thoughts &amp; Suggestions
            </label>
            <textarea
              id="feedback-message-input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What features are helping you study most, or what would you like added?"
              className="w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-inner"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Submitting as: <strong className="text-slate-600 dark:text-slate-300">{userEmail || 'Anonymous Student'}</strong></span>
              <span>{message.length} chars</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="feedback-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="feedback-submit-btn"
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
