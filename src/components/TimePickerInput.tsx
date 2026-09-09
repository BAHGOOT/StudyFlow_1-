import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current 24h value
  const [hStr, mStr] = (value || '09:00').split(':');
  const rawH = parseInt(hStr, 10) || 9;
  const currentAmPm = rawH >= 12 ? 'PM' : 'AM';
  const current12Hour = rawH % 12 === 0 ? 12 : rawH % 12;
  const currentMinute = mStr || '00';

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

  const updateTime = (hour12: number, minuteStr: string, ampm: 'AM' | 'PM') => {
    let h24 = hour12;
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    const hFormatted = String(h24).padStart(2, '0');
    onChange(`${hFormatted}:${minuteStr}`);
  };

  const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  const minutesList = ['00', '15', '30', '45'];

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
        <div className="absolute z-50 mt-1.5 left-0 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick presets row */}
          {quickPresets.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Common Class Times
              </div>
              <div className="flex flex-wrap gap-1">
                {quickPresets.map((preset) => {
                  const isSelected = value === preset;
                  return (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        onChange(preset);
                        setIsOpen(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
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

          {/* Precision Selector: Hour, Minute, AM/PM */}
          <div className="border-t border-slate-100 pt-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Custom Time Selection
            </div>

            {/* AM / PM Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 mb-2.5">
              {(['AM', 'PM'] as const).map((period) => (
                <button
                  type="button"
                  key={period}
                  onClick={() => updateTime(current12Hour, currentMinute, period)}
                  className={`flex-1 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    currentAmPm === period
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Hours Grid */}
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Hour</span>
              <div className="grid grid-cols-6 gap-1">
                {hoursList.map((hr) => {
                  const isSelected = current12Hour === hr;
                  return (
                    <button
                      type="button"
                      key={hr}
                      onClick={() => updateTime(hr, currentMinute, currentAmPm)}
                      className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                      }`}
                    >
                      {hr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Grid */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Minutes</span>
              <div className="grid grid-cols-4 gap-1">
                {minutesList.map((min) => {
                  const isSelected = currentMinute === min;
                  return (
                    <button
                      type="button"
                      key={min}
                      onClick={() => {
                        updateTime(current12Hour, min, currentAmPm);
                        setIsOpen(false);
                      }}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                      }`}
                    >
                      :{min}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
