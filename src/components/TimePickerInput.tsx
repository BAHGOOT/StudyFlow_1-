import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check, Plus, Minus } from 'lucide-react';

interface TimePickerInputProps {
  value: string; // "HH:mm" in 24h format (e.g. "09:00", "14:30")
  onChange: (time: string) => void;
  label?: string;
  id?: string;
  quickPresets?: string[]; // e.g. ["08:30", "09:00", "10:00", "11:00", "13:00", "14:00"]
  className?: string;
}

// Convert 24h time "14:30" to 12h string "2:30 PM"
export function formatTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function TimePickerInput({
  value,
  onChange,
  label,
  id,
  quickPresets = ['08:30', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:30', '17:00'],
  className = '',
}: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minuteTab, setMinuteTab] = useState<'any' | 'presets'>('any');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current 24h value
  const [hStr, mStr] = (value || '09:00').split(':');
  const rawH = parseInt(hStr, 10) || 9;
  const currentAmPm: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
  const current12Hour = rawH % 12 === 0 ? 12 : rawH % 12;
  const numericMinute = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  const currentMinuteStr = String(numericMinute).padStart(2, '0');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateTime = (hour12: number, minuteNum: number, ampm: 'AM' | 'PM') => {
    const clampedMinute = Math.min(59, Math.max(0, minuteNum));
    const minuteStr = String(clampedMinute).padStart(2, '0');
    let h24 = hour12;
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    const hFormatted = String(h24).padStart(2, '0');
    onChange(`${hFormatted}:${minuteStr}`);
  };

  const adjustMinute = (delta: number) => {
    let nextMin = numericMinute + delta;
    if (nextMin > 59) nextMin = 0;
    if (nextMin < 0) nextMin = 59;
    updateTime(current12Hour, nextMin, currentAmPm);
  };

  // Full 12 hours arranged in order
  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // 5-minute interval quick chips
  const fiveMinuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          {label}
        </label>
      )}

      {/* Main trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs text-xs font-semibold text-slate-800 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono text-xs font-bold text-slate-900">
            {formatTo12Hour(value)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">({value})</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Picker Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Preview & AM/PM Toggle */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-mono text-indigo-600 tracking-tight">
                {current12Hour}:{currentMinuteStr}
              </span>
              <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {currentAmPm}
              </span>
            </div>

            {/* AM / PM Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {(['AM', 'PM'] as const).map((period) => (
                <button
                  type="button"
                  key={period}
                  onClick={() => updateTime(current12Hour, numericMinute, period)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    currentAmPm === period
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets row (if available) */}
          {quickPresets.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Common Times
              </div>
              <div className="flex flex-wrap gap-1">
                {quickPresets.slice(0, 6).map((preset) => {
                  const isSelected = value === preset;
                  return (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        onChange(preset);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {formatTo12Hour(preset)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hours Grid (1 to 12) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Hour
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 font-mono">
                {current12Hour} {currentAmPm}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {hoursList.map((hr) => {
                const isSelected = current12Hour === hr;
                return (
                  <button
                    type="button"
                    key={hr}
                    onClick={() => updateTime(hr, numericMinute, currentAmPm)}
                    className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                        : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                    }`}
                  >
                    {hr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes Section: Pick Whatever Minute You Want! */}
          <div className="border-t border-slate-100 pt-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Minute ({currentMinuteStr}m)
              </span>

              {/* Toggle view: Any Minute / Quick 5-min */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMinuteTab('any')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    minuteTab === 'any'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Exact (0–59)
                </button>
                <button
                  type="button"
                  onClick={() => setMinuteTab('presets')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    minuteTab === 'presets'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  5-Min Steps
                </button>
              </div>
            </div>

            {/* Exact Minute Controls (Slider, Direct Input, Stepper) */}
            {minuteTab === 'any' ? (
              <div className="space-y-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                {/* Stepper + Direct Typing */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustMinute(-5)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-bold shadow-2xs active:scale-95 cursor-pointer"
                      title="-5 minutes"
                    >
                      -5m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustMinute(-1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs active:scale-95 cursor-pointer"
                      title="-1 minute"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Direct editable minute box */}
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                    <span className="text-xs text-slate-400 font-mono">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={currentMinuteStr}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          updateTime(current12Hour, val, currentAmPm);
                        } else if (e.target.value === '') {
                          updateTime(current12Hour, 0, currentAmPm);
                        }
                      }}
                      className="w-10 text-center font-mono font-bold text-sm text-indigo-700 focus:outline-none bg-transparent"
                    />
                    <span className="text-[10px] font-semibold text-slate-400">min</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustMinute(1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs active:scale-95 cursor-pointer"
                      title="+1 minute"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustMinute(5)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-bold shadow-2xs active:scale-95 cursor-pointer"
                      title="+5 minutes"
                    >
                      +5m
                    </button>
                  </div>
                </div>

                {/* Minute Scrubbing Slider (0 to 59) */}
                <div className="px-1 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="59"
                    step="1"
                    value={numericMinute}
                    onChange={(e) => updateTime(current12Hour, parseInt(e.target.value, 10), currentAmPm)}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>:00</span>
                    <span>:15</span>
                    <span>:30</span>
                    <span>:45</span>
                    <span>:59</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 5-minute interval grid */
              <div className="grid grid-cols-4 gap-1">
                {fiveMinuteSteps.map((minNum) => {
                  const minStr = String(minNum).padStart(2, '0');
                  const isSelected = numericMinute === minNum;
                  return (
                    <button
                      type="button"
                      key={minNum}
                      onClick={() => {
                        updateTime(current12Hour, minNum, currentAmPm);
                      }}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                      }`}
                    >
                      :{minStr}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick confirmation button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply Time ({formatTo12Hour(value)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

