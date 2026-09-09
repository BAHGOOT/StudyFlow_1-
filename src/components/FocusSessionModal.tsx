import { useState } from 'react';
import { TreeSpecies } from '../types';
import { FocusSessionController } from '../hooks/useFocusSession';
import {
  Minus,
  X,
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  Trees,
  ShoppingBag,
  AlertCircle,
  Coffee,
  Sparkles,
  Info,
  Footprints,
  Eye,
  Droplets,
  Wind,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { TreeIllustration } from './TreeIllustration';
import { TREE_SPECIES_CATALOG } from '../data/treeSpecies';

interface FocusSessionModalProps {
  isOpen: boolean;
  focusSession: FocusSessionController;
  coins: number;
  unlockedSpecies: TreeSpecies[];
  onNavigateToStore?: () => void;
}

export function FocusSessionModal({
  isOpen,
  focusSession,
  coins,
  unlockedSpecies,
  onNavigateToStore,
}: FocusSessionModalProps) {
  const [showAbandonConfirm, setShowAbandonConfirm] = useState<boolean>(false);

  const {
    activeTask: task,
    activeCourse: course,
    mode,
    pomodoroCount,
    accumulatedFocusMinutes,
    selectedSpecies,
    setSelectedSpecies,
    secondsRemaining,
    initialSeconds,
    isActive,
    toggleActive,
    progressPercent,
    formattedTime,
    hasPlantedThisSession,
    minimizeSession,
    abandonSession,
    finishAndComplete,
    addFiveMinutes,
    resetTimer,
    startNextFocusBlock,
  } = focusSession;

  if (!isOpen || !task) return null;

  const isTimerFinished = secondsRemaining === 0;
  const hasTimerStarted = secondsRemaining < initialSeconds;

  // Filter species catalog to only show unlocked species
  const ownedSpeciesCatalog = TREE_SPECIES_CATALOG.filter((spec) =>
    unlockedSpecies.includes(spec.id)
  );

  const handleAbandon = () => {
    setShowAbandonConfirm(false);
    abandonSession();
  };

  return (
    <div
      id="focus-session-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="focus-session-card"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-4 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Abandon confirmation overlay */}
        {showAbandonConfirm && (
          <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-xs flex items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-900 space-y-3 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">Abandon Focus Session?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you abandon now, your current seedling will not bloom into a tree, and this task will remain incomplete.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbandonConfirm(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Keep Focusing
                </button>
                <button
                  type="button"
                  onClick={handleAbandon}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Yes, Abandon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Status Banner */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                mode === 'focus' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                {mode === 'focus'
                  ? '30-Minute Focus Block'
                  : mode === 'short_break'
                  ? '5-Minute Active Recovery Break'
                  : '30-Minute Long Break (3h Milestone reached 🎉)'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Cycle #{pomodoroCount} • Accumulated: {accumulatedFocusMinutes}m / 180m towards Long Break
              </span>
            </div>
          </div>

          {/* Top-right control buttons: Minimize (-) and Abandon (X) */}
          <div className="flex items-center gap-1.5">
            <button
              id="focus-minimize-btn"
              type="button"
              onClick={minimizeSession}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Minimize to background"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              id="focus-close-btn"
              type="button"
              onClick={() => setShowAbandonConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Abandon Session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Course & Task Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: course?.accentHex || '#4f46e5' }}
            >
              {course?.name || 'Academic Course'}
            </span>
            <span className="text-xs text-slate-500 font-medium">{task.type}</span>
          </div>

          <h2 className="text-lg md:text-xl font-bold font-display text-slate-900 max-w-md">
            {task.name}
          </h2>

          {/* Description of what the student has for this task (if available) */}
          {task.notes && (
            <div className="mt-3 mb-2 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-left max-w-md w-full">
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900 mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Task Details & Description:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {task.notes}
              </p>
            </div>
          )}

          {/* Dynamic Illustration or Recovery Guide */}
          {mode === 'focus' ? (
            <div className="my-4 flex flex-col items-center">
              <div className="relative">
                <TreeIllustration
                  progressPercent={progressPercent}
                  species={selectedSpecies}
                  size="lg"
                  className="w-40 h-40 drop-shadow-md"
                />
                {hasPlantedThisSession && (
                  <span className="absolute bottom-2 px-2.5 py-1 bg-emerald-500 text-white font-bold text-[10px] rounded-full shadow-xs flex items-center gap-1 animate-in fade-in zoom-in">
                    <Sparkles className="w-3 h-3" />
                    <span>Planted & Bloomed!</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* SCIENTIFIC BREAK PROTOCOL & RECOVERY GUIDE */
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 text-left max-w-md w-full space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs border-b border-amber-200/60 pb-2">
                <Coffee className="w-4 h-4 text-amber-700" />
                <span>
                  {mode === 'long_break'
                    ? '30m Long Rest: Deep Cognitive Restoration Protocol'
                    : '5m Active Recovery: Research-Backed Focus Restoration'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <Footprints className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">Stand Up & Move (Stanford Medicine):</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Stand up from your desk. Light walking increases cerebral blood flow and clears adenosine accumulation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Eye className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">20-20-20 Vision Relief:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Look at an object at least 20 feet (6 meters) away for 20 seconds to relax ciliary eye muscles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Droplets className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">Hydrate & Refresh:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Drink a full glass of cold water. Mild 1-2% dehydration directly impairs working memory.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Wind className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">Physiological Sigh (Cell Reports):</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Two quick inhales through nose, one long slow exhale through mouth to drop heart rate and anxiety.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={startNextFocusBlock}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Ready to Study? Start Next 30m Focus Block</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Big timer countdown display */}
          <div className="mt-3 mb-4 flex flex-col items-center">
            <div className="text-5xl md:text-6xl font-mono font-extrabold tracking-tight text-slate-900">
              {formattedTime}
            </div>

            {/* Progress bar */}
            <div className="w-64 h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  mode === 'focus' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400 mt-1.5">
              {mode === 'focus' ? (
                <>30m Focus Session • Species: <strong>{selectedSpecies}</strong></>
              ) : mode === 'short_break' ? (
                <>5m Short Break • Stand up and refresh!</>
              ) : (
                <>30m Long Break • Recharging after 3 hours of focus!</>
              )}
            </span>
          </div>

          {/* Controls: Play, Pause, +5m, Reset */}
          <div className="flex items-center gap-3 mb-4">
            <button
              id="focus-toggle-play"
              type="button"
              onClick={toggleActive}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              id="focus-add-time"
              type="button"
              onClick={addFiveMinutes}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
              title="Add 5 minutes"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+5m</span>
            </button>

            <button
              id="focus-reset-timer"
              type="button"
              onClick={resetTimer}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tree Species Selector Section (ONLY SHOW OWNED TREES BEFORE TIMER STARTS IN FOCUS MODE) */}
          {!hasTimerStarted && mode === 'focus' && (
            <div className="w-full pt-3 pb-3 border-t border-slate-100 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    Select Tree For This Session:
                  </span>
                </div>
                {onNavigateToStore && (
                  <button
                    type="button"
                    onClick={() => {
                      minimizeSession();
                      onNavigateToStore();
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Store ({coins} 🪙)</span>
                  </button>
                )}
              </div>

              {/* Only display unlocked trees */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ownedSpeciesCatalog.map((spec) => {
                  const isSelected = selectedSpecies === spec.id;
                  return (
                    <button
                      key={spec.id}
                      id={`focus-select-species-${spec.id.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => setSelectedSpecies(spec.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-2 ring-emerald-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{spec.name}</span>
                      {spec.isFree ? (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          Starter
                        </span>
                      ) : (
                        <span className="text-[10px]">🌲</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              id="focus-abandon-btn"
              type="button"
              onClick={() => setShowAbandonConfirm(true)}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-rose-50"
              title="Abandon focus session"
            >
              <X className="w-3.5 h-3.5" />
              <span>Abandon Session</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="focus-minimize-btn-bottom"
                type="button"
                onClick={minimizeSession}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition-colors border border-slate-200"
                title="Keep timer running in background"
              >
                Minimize
              </button>

              {(isTimerFinished || mode !== 'focus' || hasPlantedThisSession) && (
                <button
                  id="focus-complete-task-btn"
                  type="button"
                  onClick={finishAndComplete}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Harvest Tree & Complete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
