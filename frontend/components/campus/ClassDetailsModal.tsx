"use client";

import { Calendar, Clock, MapPin, Users, GraduationCap, X, CheckCircle, AlertTriangle } from "lucide-react";

interface ClassSessionDetail {
  subject: string;
  room: string;
  building: string;
  floor: number;
  facultyName: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  enrolledCount?: number;
  equipmentStatus?: string[];
}

export function ClassDetailsModal({
  classSession,
  isOpen,
  onClose,
}: {
  classSession: ClassSessionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !classSession) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-red-400 font-semibold">{classSession.sessionType || "Lecture"}</span>
            <h2 className="text-xl font-bold text-white leading-tight">{classSession.subject}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Faculty Instructor: {classSession.facultyName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Classroom & Building</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-red-400" /> {classSession.building} {classSession.room} (Floor {classSession.floor || 3})
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Scheduled Time</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4 text-blue-400" /> {classSession.startTime} - {classSession.endTime}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Enrolled Roster</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <Users className="w-4 h-4 text-emerald-400" /> {classSession.enrolledCount || 45} Students
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Classroom Equipment</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Projector, AC, Wi-Fi
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Notice: CSB Lift 2 under maintenance. Please use stairs or main elevator.</span>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
