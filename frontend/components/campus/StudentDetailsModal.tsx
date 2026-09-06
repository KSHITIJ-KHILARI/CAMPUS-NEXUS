"use client";

import { User, GraduationCap, Mail, Award, Calendar, X } from "lucide-react";

interface StudentRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  roll_number?: string;
  semester?: number;
  cgpa?: number;
  program_name?: string;
}

export function StudentDetailsModal({
  student,
  isOpen,
  onClose,
}: {
  student: StudentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold uppercase">
            {student.full_name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{student.full_name}</h2>
            <p className="text-xs text-gray-400">Roll No: {student.roll_number || "1012023001"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Academic Program</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <GraduationCap className="w-4 h-4 text-red-400" /> {student.program_name || "B.Tech Computer Science"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Current Semester</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4 text-blue-400" /> Semester {student.semester || 5}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Cumulative GPA</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <Award className="w-4 h-4 text-emerald-400" /> {student.cgpa || 8.9} / 10.0
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Campus Email</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1 truncate">
              <Mail className="w-4 h-4 text-purple-400" /> {student.email}
            </div>
          </div>
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
