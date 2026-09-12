import React, { useState, useEffect } from 'react';
import { CollegeLecture, CollegeCommute, Course, StudyAvailability, Task } from '../types';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Car,
  Plus,
  Trash2,
  MapPin,
  BookOpen,
  Hourglass,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ScannedTimetableResult } from '../services/timetableScannerService';
import { TimePickerInput } from './TimePickerInput';

interface CollegeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  tasks: Task[];
  lectures: CollegeLecture[];
  commute: CollegeCommute;
  availability: StudyAvailability;
  onUpdateLectures: (lectures: CollegeLecture[]) => void;
  onUpdateCommute: (commute: CollegeCommute) => void;
  onApplySuggestedAvailability: (newDailyHours: StudyAvailability['dailyHours'], autoGenerateTasks?: boolean) => void;
  onApplyScannedSchedule?: (result: ScannedTimetableResult) => void;
}

const DAYS_LIST: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function CollegeScheduleModal({
  isOpen,
  onClose,
  courses,
  lectures,
  commute,
  availability,
  onUpdateLectures,
  onUpdateCommute,
  onApplySuggestedAvailability,
}: CollegeScheduleModalProps) {
  // Default active tab to manual written entry
  const [activeTab, setActiveTab] = useState<'written' | 'image'>('written');
  const [localLectures, setLocalLectures] = useState<CollegeLecture[]>(lectures);
  const [commuteTo, setCommuteTo] = useState<number>(commute.commuteToCollegeMinutes || 30);
  const [commuteFrom, setCommuteFrom] = useState<number>(commute.commuteFromCollegeMinutes || 30);

  // Form states for manual lecture addition
  const [selectedCourseOption, setSelectedCourseOption] = useState<string>(
    courses.length > 0 ? courses[0].name : ''
  );
  const [customCourseName, setCustomCourseName] = useState<string>('');
  const [newDay, setNewDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('11:00');
  const [newLocation, setNewLocation] = useState('Hall 201');

  // Keep state synchronized with incoming props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setLocalLectures(lectures);
      setCommuteTo(commute.commuteToCollegeMinutes || 30);
      setCommuteFrom(commute.commuteFromCollegeMinutes || 30);
      if (courses.length > 0 && (!selectedCourseOption || selectedCourseOption === '__custom__')) {
        if (!customCourseName) {
          setSelectedCourseOption(courses[0].name);
        }
      }
    }
  }, [isOpen, lectures, commute, courses]);

  if (!isOpen) return null;

  // Calculate lecture hours per day
  const calculateLectureHoursForDay = (day: string) => {
    const dayLectures = localLectures.filter((l) => l.day === day);
    let totalMinutes = 0;
    dayLectures.forEach((l) => {
      const [sh, sm] = l.startTime.split(':').map(Number);
      const [eh, em] = l.endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration > 0) totalMinutes += duration;
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  // Calculate suggested study availability for each day
  const calculateSuggestedDailyHours = () => {
    const suggested: StudyAvailability['dailyHours'] = {
      Monday: 3,
      Tuesday: 3,
      Wednesday: 3,
      Thursday: 3,
      Friday: 3,
      Saturday: 4,
      Sunday: 4,
    };

    DAYS_LIST.forEach((day) => {
      const lectureHours = calculateLectureHoursForDay(day);
      const hasCollege = lectureHours > 0;
      const commuteHours = hasCollege ? (commuteTo + commuteFrom) / 60 : 0;
      const sleepAndRoutines = 10;

      const remainingFreeTime = Math.max(0, 24 - (sleepAndRoutines + lectureHours + commuteHours));
      let recStudy = Math.round((remainingFreeTime * 0.45) * 2) / 2;
      recStudy = Math.max(1.5, Math.min(6, recStudy));
      suggested[day] = recStudy;
    });

    return suggested;
  };

  const suggestedDailyHours = calculateSuggestedDailyHours();

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCourseName =
      selectedCourseOption === '__custom__' || courses.length === 0
        ? customCourseName.trim() || 'General Lecture'
        : selectedCourseOption;

    if (!finalCourseName) return;

    const newLec: CollegeLecture = {
      id: `lec-${Date.now()}`,
      courseName: finalCourseName,
      day: newDay,
      startTime: newStart,
      endTime: newEnd,
      location: newLocation.trim(),
    };
    const updated = [...localLectures, newLec];
    setLocalLectures(updated);
    onUpdateLectures(updated);

    if (selectedCourseOption === '__custom__') {
      setCustomCourseName('');
    }
  };

  const handleDeleteLecture = (id: string) => {
    const updated = localLectures.filter((l) => l.id !== id);
    setLocalLectures(updated);
    onUpdateLectures(updated);
  };

  const handleClearAllLectures = () => {
    setLocalLectures([]);
    onUpdateLectures([]);
  };

  const handleCommuteChange = (to: number, from: number) => {
    setCommuteTo(to);
    setCommuteFrom(from);
    onUpdateCommute({
      commuteToCollegeMinutes: to,
      commuteFromCollegeMinutes: from,
    });
  };

  const handleApplySuggested = () => {
    onApplySuggestedAvailability(suggestedDailyHours, true);
    onClose();
  };

  return (
    <div
      id="college-schedule-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
    >
      <div
        id="college-schedule-card"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 relative max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">
                College Lectures, Labs & Commute Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Enter your weekly college timetable to calibrate real study availability and balance your plan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Commute Time Calculation Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                <Car className="w-4 h-4 text-indigo-600" />
                <span>Daily Commute Travel Time</span>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Travel transit is deducted from class days so your study sessions are scheduled strictly during actual free hours.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  To Campus
                </label>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-slate-800 shadow-2xs">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={commuteTo}
                    onChange={(e) => handleCommuteChange(Number(e.target.value), commuteFrom)}
                    className="w-12 text-center outline-hidden font-mono"
                  />
                  <span className="text-slate-500 font-normal">mins</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Back Home
                </label>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-slate-800 shadow-2xs">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={commuteFrom}
                    onChange={(e) => handleCommuteChange(commuteTo, Number(e.target.value))}
                    className="w-12 text-center outline-hidden font-mono"
                  />
                  <span className="text-slate-500 font-normal">mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('written')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'written'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Class & Lab Schedule ({localLectures.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>AI Timetable Photo Scanner</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              </button>
            </div>

            {/* TAB 1: Written Entry (Primary) */}
            {activeTab === 'written' && (
              <div className="space-y-4">
                {/* Form to add a lecture */}
                <form
                  onSubmit={handleAddLecture}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>Add a Lecture or Lab Class</span>
                    </h4>
                    {courses.length > 0 && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Selecting from your {courses.length} enrolled course{courses.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
                    {/* Course Selection Dropdown */}
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-600" />
                        <span>Course</span>
                      </label>
                      {courses.length > 0 ? (
                        <select
                          value={selectedCourseOption}
                          onChange={(e) => setSelectedCourseOption(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white shadow-2xs outline-hidden focus:border-indigo-500 cursor-pointer"
                        >
                          {courses.map((course) => (
                            <option key={course.id} value={course.name}>
                              {course.name} {course.code ? `(${course.code})` : ''}
                            </option>
                          ))}
                          <option value="__custom__">+ Other / Custom Course...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={customCourseName}
                          onChange={(e) => setCustomCourseName(e.target.value)}
                          placeholder="e.g. Calculus III"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white shadow-2xs outline-hidden focus:border-indigo-500"
                          required
                        />
                      )}
                    </div>

                    {/* Day of Week */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white shadow-2xs outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        {DAYS_LIST.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Start Time
                      </label>
                      <TimePickerInput
                        id="new-lecture-start-time"
                        value={newStart}
                        onChange={(t) => setNewStart(t)}
                        quickPresets={['08:30', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:30']}
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        End Time
                      </label>
                      <TimePickerInput
                        id="new-lecture-end-time"
                        value={newEnd}
                        onChange={(t) => setNewEnd(t)}
                        quickPresets={['10:00', '11:00', '12:00', '13:00', '14:30', '16:00', '17:00', '18:00']}
                      />
                    </div>

                    {/* Room / Hall */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Room / Hall
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Hall 201"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white shadow-2xs outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Custom Course Name Input if user chose Other */}
                  {courses.length > 0 && selectedCourseOption === '__custom__' && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                        Enter Custom Course Name
                      </label>
                      <input
                        type="text"
                        value={customCourseName}
                        onChange={(e) => setCustomCourseName(e.target.value)}
                        placeholder="e.g. Organic Chemistry Lab"
                        className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-indigo-200 text-xs text-slate-800 bg-white shadow-2xs outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lecture to Schedule</span>
                    </button>
                  </div>
                </form>

                {/* List header & clear button */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">
                    Scheduled Lectures & Labs ({localLectures.length})
                  </span>
                  {localLectures.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllLectures}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Clear All Classes
                    </button>
                  )}
                </div>

                {/* List of current lectures */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {localLectures.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No classes added yet. Use the form above to enter your weekly lectures and labs!
                    </div>
                  ) : (
                    localLectures.map((lec) => (
                      <div
                        key={lec.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 text-xs transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
                            {lec.day}
                          </span>
                          <div>
                            <strong className="text-slate-900 font-bold block">{lec.courseName}</strong>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{lec.startTime} – {lec.endTime}</span>
                              </span>
                              {lec.location && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <MapPin className="w-3 h-3" />
                                  <span>{lec.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLecture(lec.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete lecture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AI Image Reader (Coming Soon Announcement) */}
            {activeTab === 'image' && (
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                  <Hourglass className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Feature Under Active Calibration</span>
                  </div>
                  <h3 className="text-lg font-extrabold font-display text-slate-900">
                    AI Timetable Scanner Coming Soon
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We are fine-tuning our AI vision model to recognize diverse university schedules, rotation blocks, and lab formats with 100% precision. In the meantime, please use the <strong>Class & Lab Schedule</strong> tab to enter your class times and locations in seconds.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('written')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Go to Manual Class Entry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Smart Availability Suggestions Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Calculated Study Availability Suggestions:</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Formula: 24h − (Classes + {commuteTo + commuteFrom}m Commute + 10h Sleep/Meals)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS_LIST.map((day) => {
                const lecHours = calculateLectureHoursForDay(day);
                const suggestedHours = suggestedDailyHours[day];

                return (
                  <div
                    key={day}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs"
                  >
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      {day.slice(0, 3)}
                    </span>
                    <div className="text-base font-extrabold text-indigo-600 font-display mt-0.5 font-mono">
                      {suggestedHours}h
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {lecHours > 0 ? `${lecHours}h classes` : 'No classes'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500">
            Study slots adapt instantly around your timetable and commute.
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplySuggested}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Schedule to Study Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
