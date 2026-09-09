"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Search,
  BookOpen,
  Filter,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

interface FacultySlot {
  day: string;
  start: string;
  end: string;
  location: string;
}

interface FacultyMember {
  id: string;
  faculty_id?: string;
  faculty_name?: string;
  name?: string;
  full_name?: string;
  email?: string;
  department?: string;
  designation?: string;
  is_available?: boolean;
  office_location?: string;
  status?: string;
  relationship?: "course_instructor" | "department_faculty" | "general_faculty";
  is_my_instructor?: boolean;
  courses_taught_to_student?: string[];
  available_slots?: FacultySlot[];
}

export default function StudentFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "my_teachers">("all");

  const fetchFaculty = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Backend-enforced relevant faculty endpoint
      const data = await api.faculty.getRelevant();
      const list = Array.isArray(data) ? data : (data as any).items || (data as any).data || [];
      setFaculty(list);
    } catch (err) {
      // Fallback to general availability if /relevant has issues
      try {
        const fallbackData = await api.faculty.getAllAvailability();
        const fallbackList = Array.isArray(fallbackData) ? fallbackData : (fallbackData as any).items || [];
        setFaculty(fallbackList);
      } catch (fallbackErr) {
        if (err instanceof ApiError) {
          setErrorMsg(err.message || "Unable to load faculty directory.");
        } else {
          setErrorMsg("Something went wrong while loading faculty directory.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const getDisplayName = (f: FacultyMember) =>
    f.faculty_name || f.full_name || f.name || "Faculty Member";

  const getDepartment = (f: FacultyMember) =>
    f.department || "Computer Science";

  const getDesignation = (f: FacultyMember) =>
    f.designation || "Professor";

  const filteredFaculty = faculty.filter((f) => {
    const name = getDisplayName(f).toLowerCase();
    const dept = getDepartment(f).toLowerCase();
    const email = (f.email || "").toLowerCase();
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      dept.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "my_teachers") {
      return f.is_my_instructor;
    }
    return true;
  });

  const myInstructorsCount = faculty.filter((f) => f.is_my_instructor).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-campus-primary" />
            Faculty Directory & Mentors
          </h1>
          <p className="text-gray-400 text-sm">
            Course instructors, department mentors, and office hour consultations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-campus-primary text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Relevant ({faculty.length})
          </button>
          <button
            onClick={() => setActiveTab("my_teachers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "my_teachers"
                ? "bg-campus-primary text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-3 w-3" />
            My Instructors ({myInstructorsCount})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search faculty by name, department, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-campus-card/60 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
        />
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-campus-primary" /> Loading course instructors & faculty...
        </div>
      )}

      {!loading && !errorMsg && filteredFaculty.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">
          {searchQuery
            ? "No faculty members match your search criteria."
            : "No faculty records found for your department."}
        </Card>
      )}

      {!loading && filteredFaculty.length > 0 && (
        <div className="space-y-4">
          {filteredFaculty.map((f) => {
            const available = f.is_available !== false && f.status !== "UNAVAILABLE";
            const displayName = getDisplayName(f);
            const isDirectInstructor = f.is_my_instructor;

            return (
              <Card
                key={f.id || f.faculty_id || f.email || displayName}
                className={`card-hover p-5 border-white/10 flex flex-col space-y-4 ${
                  isDirectInstructor
                    ? "bg-campus-primary/[0.04] border-campus-primary/20"
                    : "bg-campus-card/60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base uppercase border ${
                        isDirectInstructor
                          ? "bg-campus-primary/20 border-campus-primary/40 text-campus-primary"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {displayName?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{displayName}</h3>
                        {isDirectInstructor && (
                          <Badge className="bg-campus-primary/20 text-campus-primary border-campus-primary/40 text-[10px] gap-1 py-0.5">
                            <BookOpen className="h-2.5 w-2.5" />
                            My Course Instructor
                          </Badge>
                        )}
                        {f.relationship === "department_faculty" && !isDirectInstructor && (
                          <Badge variant="secondary" className="text-[10px] text-gray-400 border-white/10 py-0.5">
                            Department Faculty
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {getDesignation(f)} &bull; {getDepartment(f)}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{f.email || ""}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        f.status === "IN_CLASS" || f.status === "IN CLASS"
                          ? "bg-amber-400 animate-pulse"
                          : available
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />
                    <Badge
                      className={`text-xs capitalize ${
                        f.status === "IN_CLASS" || f.status === "IN CLASS"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          : available
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : "bg-red-500/10 text-red-300 border-red-500/20"
                      }`}
                    >
                      {f.status || (available ? "Available" : "Unavailable")}
                    </Badge>
                  </div>
                </div>

                {/* Courses Taught to Student */}
                {f.courses_taught_to_student && f.courses_taught_to_student.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-campus-primary/10 border border-campus-primary/20 text-xs flex items-center gap-2 text-campus-primary">
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    <span>
                      <strong className="font-semibold text-white">Teaches you:</strong>{" "}
                      {f.courses_taught_to_student.join(", ")}
                    </span>
                  </div>
                )}

                {/* Office Location */}
                {f.office_location && (
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <MapPin className="h-3.5 w-3.5 text-campus-primary flex-shrink-0" />
                    <span>Office: <strong className="text-white font-medium">{f.office_location}</strong></span>
                  </div>
                )}

                {/* Office Hours */}
                {f.available_slots && f.available_slots.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      Consultation & Office Hours
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5">
                      {f.available_slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-gray-400 bg-white/[0.02] p-1.5 rounded border border-white/5"
                        >
                          <span className="text-white font-medium">{slot.day}:</span>{" "}
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!available && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Currently busy or outside consultation hours.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
