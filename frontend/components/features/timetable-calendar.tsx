"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type TimetableSlot,
  type FacultyMember,
  getStoredTimetable,
  getStoredFaculty,
  cancelLectureSlot,
  restoreLectureSlot,
  addPersonalSlot,
  deleteSlot,
} from "@/lib/relationalCampusData";
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  Building2,
  Sparkles,
  Info,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";

interface TimetableCalendarProps {
  initialRole?: "student" | "faculty" | "admin";
  defaultFacultyId?: string;
  defaultStudentId?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
type DayName = typeof DAYS[number];

// Working hours: 08:00 to 18:00 (half-hour increments)
const TIME_SLOTS: string[] = [];
for (let hour = 8; hour < 18; hour++) {
  const hStr = hour.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hStr}:00`);
  TIME_SLOTS.push(`${hStr}:30`);
}
TIME_SLOTS.push("18:00");

// Convert "HH:MM" to minutes from 08:00
function timeToMinutesFromStart(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h - 8) * 60 + m;
}

export function TimetableCalendar({
  initialRole = "student",
  defaultFacultyId,
  defaultStudentId,
}: TimetableCalendarProps) {
  const [role, setRole] = useState<"student" | "faculty" | "admin">(initialRole);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>(defaultFacultyId || "all");
  const [selectedDayTab, setSelectedDayTab] = useState<DayName>("Monday");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  
  // Modals state
  const [cancellingSlot, setCancellingSlot] = useState<TimetableSlot | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [inspectSlot, setInspectSlot] = useState<TimetableSlot | null>(null);
  
  // Personal slot creation modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState<DayName>("Monday");
  const [newSlotTitle, setNewSlotTitle] = useState("");
  const [newSlotStartTime, setNewSlotStartTime] = useState("13:00");
  const [newSlotEndTime, setNewSlotEndTime] = useState("14:00");
  const [newSlotColor, setNewSlotColor] = useState("#059669");
  
  // Toast / feedback message
  const [alertBanner, setAlertBanner] = useState<{ msg: string; type: "success" | "warning" } | null>(null);

  const loadData = () => {
    setSlots(getStoredTimetable());
    setFacultyList(getStoredFaculty());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      setSlots(getStoredTimetable());
    };
    window.addEventListener("nexus-timetable-updated", handleUpdate);
    return () => window.removeEventListener("nexus-timetable-updated", handleUpdate);
  }, []);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    if (selectedFacultyFilter === "all") return slots;
    return slots.filter(s => s.faculty_id === selectedFacultyFilter || s.type === "personal");
  }, [slots, selectedFacultyFilter]);

  // Handle Lecture Cancellation (Faculty action)
  const handleConfirmCancel = () => {
    if (!cancellingSlot) return;
    const reason = cancelReason.trim() || "Faculty conference / department travel";
    cancelLectureSlot(cancellingSlot.id, reason);
    setCancellingSlot(null);
    setCancelReason("");
    setAlertBanner({
      msg: `Lecture ${cancellingSlot.course_code} cancelled! Slot unlocked for students & Room ${cancellingSlot.room_number} marked vacant. Central notification dispatched.`,
      type: "warning",
    });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  // Handle Restore Lecture
  const handleRestoreSlot = (slotId: string) => {
    restoreLectureSlot(slotId);
    setAlertBanner({
      msg: "Lecture restored to official locked timetable.",
      type: "success",
    });
    setTimeout(() => setAlertBanner(null), 4000);
  };

  // Handle Personal Slot Submit
  const handleAddPersonalSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTitle.trim()) return;

    addPersonalSlot({
      title: newSlotTitle,
      day_of_week: newSlotDay,
      start_time: newSlotStartTime,
      end_time: newSlotEndTime,
      color: newSlotColor,
    });

    setIsAddModalOpen(false);
    setNewSlotTitle("");
    setAlertBanner({
      msg: `Personal study task added for ${newSlotDay} (${newSlotStartTime} - ${newSlotEndTime})`,
      type: "success",
    });
    setTimeout(() => setAlertBanner(null), 4000);
  };

  // Delete Personal Task
  const handleDeleteSlot = (id: string) => {
    deleteSlot(id);
    if (inspectSlot?.id === id) setInspectSlot(null);
  };

  // Quick Stats
  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const cancelledCount = slots.filter(s => s.is_cancelled).length;
    const personalCount = slots.filter(s => s.type === "personal").length;
    return { totalSlots, cancelledCount, personalCount };
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all animate-fadeIn ${
            alertBanner.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertBanner.type === "warning" ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            <span>{alertBanner.msg}</span>
          </div>
          <button onClick={() => setAlertBanner(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Role / Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12121e]/90 p-4 md:p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Academic Timetable Matrix
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Mon–Fri Google Calendar-style weekly schedule with live slot locking & cancellation workflow
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Faculty Schedule Filter */}
          <div className="flex items-center gap-2 bg-[#181828] border border-white/10 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-[#A51C30]" />
            <select
              value={selectedFacultyFilter}
              onChange={(e) => setSelectedFacultyFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181828] text-white">All Faculty Schedules</option>
              {facultyList.map((fac) => (
                <option key={fac.id} value={fac.id} className="bg-[#181828] text-white">
                  {fac.name} ({fac.department.split(" ")[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Role Switcher — Strictly hidden for students, only visible in faculty/admin context */}
          {(initialRole === "faculty" || initialRole === "admin") && (
            <div className="flex items-center bg-[#181828] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setRole("faculty")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  role === "faculty" ? "bg-[#A51C30] text-white shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                Faculty Mode (Cancel / Manage)
              </button>
              <button
                onClick={() => setRole("student")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  role === "student" ? "bg-[#A51C30] text-white shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                Preview Student View
              </button>
            </div>
          )}

          {/* Add Personal Event Button */}
          <Button
            onClick={() => {
              setNewSlotDay(selectedDayTab);
              setIsAddModalOpen(true);
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Personal Task
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#12121e]/80 border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total Timetable Slots</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.totalSlots}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#12121e]/80 border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Freed / Cancelled Slots</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.cancelledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Unlock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[#12121e]/80 border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Personal Study Slots</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.personalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Weekly Mon-Fri Grid / Day Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        {/* Days of Week Tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {DAYS.map((day) => {
            const daySlotCount = filteredSlots.filter(s => s.day_of_week === day).length;
            const isSelected = selectedDayTab === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDayTab(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-white/15 text-white border border-white/20 shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{day}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? "bg-[#A51C30] text-white" : "bg-white/10 text-gray-300"
                }`}>
                  {daySlotCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="hidden sm:flex items-center gap-2 bg-[#181828] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === "week" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Weekly Grid (Mon–Fri)
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === "day" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Day View
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE CALENDAR-STYLE WEEKLY GRID VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === "week" ? (
        <Card className="p-4 md:p-6 bg-[#12121e]/90 border-white/10 overflow-x-auto backdrop-blur-xl">
          <div className="min-w-[780px]">
            {/* Grid Header: Days of Week */}
            <div className="grid grid-cols-6 border-b border-white/10 pb-3 text-center">
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> Time
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={`text-xs font-bold py-1.5 rounded-lg transition-all ${
                    day === "Monday" // current demo day
                      ? "text-[#A51C30] bg-[#A51C30]/10 border border-[#A51C30]/20"
                      : "text-gray-300"
                  }`}
                >
                  {day}
                  {day === "Monday" && (
                    <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">● Today</span>
                  )}
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="divide-y divide-white/5 relative">
              {/* Current time indicator line on today */}
              <div
                className="hidden lg:block absolute left-[16.666%] w-[16.666%] border-t-2 border-red-500 z-20 pointer-events-none"
                style={{
                  top: `${(timeToMinutesFromStart("10:30") / (10 * 60)) * 100}%`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -mt-1.5 -ml-1 shadow-md shadow-red-500/50" />
              </div>

              {/* Time Blocks from 08:00 to 17:00 */}
              {[
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ].map((hour) => {
                return (
                  <div key={hour} className="grid grid-cols-6 min-h-[90px] group">
                    {/* Time Label on Y Axis */}
                    <div className="text-xs font-mono text-gray-400 pt-2 pr-3 text-right border-r border-white/5">
                      {hour}
                    </div>

                    {/* Mon - Fri Column Cells */}
                    {DAYS.map((day) => {
                      // Find slots starting in this hour block
                      const dayHourSlots = filteredSlots.filter((slot) => {
                        if (slot.day_of_week !== day) return false;
                        const [slotH] = slot.start_time.split(":");
                        const [rowH] = hour.split(":");
                        return slotH === rowH;
                      });

                      return (
                        <div
                          key={day}
                          onClick={() => {
                            if (dayHourSlots.length === 0) {
                              setNewSlotDay(day);
                              setNewSlotStartTime(hour);
                              const nextH = (parseInt(hour.split(":")[0]) + 1).toString().padStart(2, "0");
                              setNewSlotEndTime(`${nextH}:00`);
                              setIsAddModalOpen(true);
                            }
                          }}
                          className={`p-1.5 border-r border-white/5 relative transition-colors ${
                            dayHourSlots.length === 0 ? "hover:bg-white/[0.02] cursor-pointer" : ""
                          }`}
                        >
                          {dayHourSlots.map((slot) => {
                            const isCancelled = slot.is_cancelled;
                            const isPersonal = slot.type === "personal";

                            return (
                              <div
                                key={slot.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectSlot(slot);
                                }}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-md relative overflow-hidden mb-1.5 ${
                                  isCancelled
                                    ? "bg-red-950/25 border-dashed border-red-500/50 text-red-200"
                                    : isPersonal
                                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                                    : "bg-[#1c1a2e] border-white/15 text-white hover:border-[#A51C30]"
                                }`}
                              >
                                {/* Top Badge & Lock Icon */}
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                      isCancelled
                                        ? "bg-red-500/20 text-red-400"
                                        : isPersonal
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-[#A51C30]/20 text-[#A51C30]"
                                    }`}
                                  >
                                    {slot.course_code}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    {isCancelled ? (
                                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <Unlock className="w-2.5 h-2.5" /> FREE
                                      </span>
                                    ) : slot.is_locked ? (
                                      <span title="Locked official lecture"><Lock className="w-3 h-3 text-gray-400" /></span>
                                    ) : (
                                      <span title="Unlocked personal task"><Unlock className="w-3 h-3 text-emerald-400" /></span>
                                    )}
                                  </div>
                                </div>

                                {/* Slot Title */}
                                <p className={`text-xs font-semibold leading-snug line-clamp-1 ${
                                  isCancelled ? "line-through text-gray-400" : "text-white"
                                }`}>
                                  {slot.course_name}
                                </p>

                                {/* Time & Location */}
                                <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                                  <span>{slot.start_time}–{slot.end_time}</span>
                                  <span className="truncate max-w-[70px]">{slot.room_number}</span>
                                </div>

                                {/* Faculty / Personal Tag */}
                                <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-400">
                                  <span className="truncate">{slot.faculty_name}</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Hover prompt to add task if cell is empty */}
                          {dayHourSlots.length === 0 && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500 flex items-center justify-center h-full">
                              <Plus className="w-3 h-3 mr-0.5" /> Add Task
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* ------------------------------------------------------------- */
        /* SINGLE DAY AGENDA VIEW */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              Schedule for {selectedDayTab}
            </h3>
            <span className="text-xs text-gray-400">
              {filteredSlots.filter(s => s.day_of_week === selectedDayTab).length} Slots scheduled
            </span>
          </div>

          <div className="space-y-3">
            {filteredSlots
              .filter(s => s.day_of_week === selectedDayTab)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((slot) => {
                const isCancelled = slot.is_cancelled;
                const isPersonal = slot.type === "personal";

                return (
                  <Card
                    key={slot.id}
                    className={`p-4 md:p-5 border transition-all ${
                      isCancelled
                        ? "bg-red-950/20 border-red-500/30"
                        : isPersonal
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-[#141422] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Time & Course */}
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[70px] bg-white/5 p-2 rounded-xl border border-white/10">
                          <p className="font-mono text-sm font-bold text-white">{slot.start_time}</p>
                          <p className="text-[10px] text-gray-400">to {slot.end_time}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
                              {slot.course_code}
                            </span>
                            <h4 className={`text-base font-bold ${isCancelled ? "line-through text-gray-400" : "text-white"}`}>
                              {slot.course_name}
                            </h4>
                            {isCancelled && (
                              <Badge variant="danger">Cancelled Lecture • Slot Unlocked</Badge>
                            )}
                            {slot.is_locked ? (
                              <Badge variant="secondary">
                                <Lock className="w-3 h-3 mr-1 inline" /> Official Locked Slot
                              </Badge>
                            ) : (
                              <Badge variant="success">
                                <Unlock className="w-3 h-3 mr-1 inline" /> Unlocked
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {slot.building} • {slot.room_number}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                              Faculty: {slot.faculty_name}
                            </span>
                          </div>

                          {isCancelled && slot.cancellation_reason && (
                            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-2 inline-block">
                              <strong>Cancellation Reason:</strong> {slot.cancellation_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {/* Faculty Cancel / Restore Actions */}
                        {role === "faculty" && !isPersonal && (
                          <>
                            {isCancelled ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreSlot(slot.id)}
                                className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Restore Lecture
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancellingSlot(slot);
                                  setCancelReason("");
                                }}
                                className="text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Cancel Lecture
                              </Button>
                            )}
                          </>
                        )}

                        {/* Student freed slot task button */}
                        {isCancelled && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewSlotDay(slot.day_of_week);
                              setNewSlotStartTime(slot.start_time);
                              setNewSlotEndTime(slot.end_time);
                              setNewSlotTitle(`Study: ${slot.course_code} Self Review`);
                              setIsAddModalOpen(true);
                            }}
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task in Freed Slot
                          </Button>
                        )}

                        {isPersonal && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-xs border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectSlot(slot)}
                          className="text-xs border-white/10 text-gray-300 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CANCEL LECTURE MODAL (FACULTY WORKFLOW) */}
      {/* ------------------------------------------------------------- */}
      {cancellingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[#161626] border-white/15 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Cancel Official Lecture</h3>
              </div>
              <button
                onClick={() => setCancellingSlot(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400">Target Session:</p>
              <p className="text-sm font-bold text-white">
                {cancellingSlot.course_code}: {cancellingSlot.course_name}
              </p>
              <p className="text-xs text-gray-300">
                {cancellingSlot.day_of_week}, {cancellingSlot.start_time} – {cancellingSlot.end_time} in {cancellingSlot.room_number} ({cancellingSlot.building})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                Reason for Cancellation (Notified to all enrolled students):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Faculty travelling for National AI Summit / Urgent department meeting"
                rows={3}
                className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Automated System Cascades:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                <li>Slot unlocks for students to add personal study tasks.</li>
                <li>Room {cancellingSlot.room_number} is marked as VACANT in Vacant Rooms module.</li>
                <li>Central notification alert is dispatched to students.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCancellingSlot(null)}
                className="border-white/10 text-gray-300 hover:bg-white/5 text-xs"
              >
                Keep Lecture
              </Button>
              <Button
                onClick={handleConfirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4"
              >
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD PERSONAL STUDY TASK / EVENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 bg-[#161626] border-white/15 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Add Personal Event / Task</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPersonalSlot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Task / Event Title:
                </label>
                <input
                  type="text"
                  required
                  value={newSlotTitle}
                  onChange={(e) => setNewSlotTitle(e.target.value)}
                  placeholder="e.g., LeetCode Algorithms Practice, Library Focus"
                  className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Day:</label>
                  <select
                    value={newSlotDay}
                    onChange={(e) => setNewSlotDay(e.target.value as DayName)}
                    className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start Time:</label>
                  <select
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">End Time:</label>
                  <select
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Category Color:</label>
                <div className="flex items-center gap-3">
                  {[
                    { label: "Green", code: "#059669" },
                    { label: "Blue", code: "#2563eb" },
                    { label: "Purple", code: "#9333ea" },
                    { label: "Amber", code: "#d97706" },
                  ].map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setNewSlotColor(c.code)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newSlotColor === c.code ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.code }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-white/10 text-gray-300 hover:bg-white/5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  Add to My Timetable
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* INSPECT SLOT DETAILS MODAL */}
      {/* ------------------------------------------------------------- */}
      {inspectSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[#161626] border-white/15 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
                  {inspectSlot.course_code}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{inspectSlot.course_name}</h3>
              </div>
              <button
                onClick={() => setInspectSlot(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <span className="text-gray-400 block mb-0.5">Day & Time</span>
                <p className="font-semibold text-white">{inspectSlot.day_of_week} • {inspectSlot.start_time}–{inspectSlot.end_time}</p>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Campus Room</span>
                <p className="font-semibold text-white">{inspectSlot.room_number} ({inspectSlot.building})</p>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Faculty / Instructor</span>
                <p className="font-semibold text-white">{inspectSlot.faculty_name}</p>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Session Status</span>
                {inspectSlot.is_cancelled ? (
                  <span className="text-red-400 font-bold">Cancelled Lecture (Room Freed)</span>
                ) : inspectSlot.is_locked ? (
                  <span className="text-emerald-400 font-bold">Locked Official Lecture</span>
                ) : (
                  <span className="text-blue-400 font-bold">Personal Slot</span>
                )}
              </div>
            </div>

            {inspectSlot.is_cancelled && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                <p className="font-semibold">Cancellation Reason:</p>
                <p className="mt-0.5 text-gray-300">{inspectSlot.cancellation_reason || "Faculty personal travel / event"}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              {inspectSlot.type === "personal" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSlot(inspectSlot.id)}
                  className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Task
                </Button>
              ) : role === "faculty" && !inspectSlot.is_cancelled ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCancellingSlot(inspectSlot);
                    setInspectSlot(null);
                  }}
                  className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Cancel Lecture
                </Button>
              ) : <div />}

              <Button
                size="sm"
                onClick={() => setInspectSlot(null)}
                className="bg-[#A51C30] hover:bg-[#851626] text-white text-xs px-4"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
