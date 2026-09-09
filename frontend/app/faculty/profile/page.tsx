"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { api } from "@/lib/api-client";
import {
  type FacultyMember,
  getStoredFaculty,
  updateFacultyStatus,
  initialCourses,
} from "@/lib/relationalCampusData";
import {
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

export default function FacultyProfilePage() {
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [currentStatus, setCurrentStatus] = useState<"AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE">("AVAILABLE");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const list = getStoredFaculty();
    setFacultyList(list);
    if (list.length > 0) {
      setSelectedFaculty(list[0]);
      setCurrentStatus(list[0].manual_status || "AVAILABLE");
    }
  }, []);

  const handleSelectFaculty = (id: string) => {
    const found = facultyList.find(f => f.id === id);
    if (found) {
      setSelectedFaculty(found);
      setCurrentStatus(found.manual_status || "AVAILABLE");
    }
  };

  const handleStatusChange = (status: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE") => {
    if (!selectedFaculty) return;
    const updated = updateFacultyStatus(selectedFaculty.id, status);
    setCurrentStatus(status);
    setSelectedFaculty({ ...updated });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (!selectedFaculty) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
        </div>
        <Card className="p-8 text-center bg-[#12121e]/80 border-white/10">
          <p className="text-gray-400">Loading faculty profile...</p>
        </Card>
      </div>
    );
  }

  const teachingCourses = initialCourses.filter(c => c.faculty_id === selectedFaculty.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Available Now</Badge>;
      case "IN CLASS":
        return <Badge variant="warning">In Class / Teaching</Badge>;
      case "OFFICE HOURS":
        return <Badge variant="info">Office Hours Active</Badge>;
      default:
        return <Badge variant="secondary">Unavailable / Off Campus</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header with Switcher & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
        
        {/* Profile Selector */}
        <div className="flex items-center gap-3 bg-[#161622] border border-white/10 px-3 py-1.5 rounded-xl">
          <UserCheck className="w-4 h-4 text-[#A51C30]" />
          <span className="text-xs text-gray-400 font-medium">Switch Faculty View:</span>
          <select
            value={selectedFaculty.id}
            onChange={(e) => handleSelectFaculty(e.target.value)}
            className="bg-[#1f1f30] text-sm text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
          >
            {facultyList.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.department.split(" ")[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <Card className="p-6 md:p-8 bg-[#12121e]/90 border-white/10 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#A51C30]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar & Department Tag */}
          <div className="relative">
            <img
              src={selectedFaculty.avatar}
              alt={selectedFaculty.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-white/15 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2">
              <span className={`flex h-4 w-4 rounded-full ring-2 ring-[#12121e] ${
                currentStatus === "AVAILABLE" ? "bg-emerald-500" :
                currentStatus === "OFFICE HOURS" ? "bg-cyan-500" :
                currentStatus === "IN CLASS" ? "bg-amber-500" : "bg-gray-500"
              }`} />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{selectedFaculty.name}</h1>
              {getStatusBadge(currentStatus)}
            </div>
            
            <p className="text-[#A51C30] font-medium text-sm md:text-base">
              {selectedFaculty.designation} • {selectedFaculty.department}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedFaculty.office_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedFaculty.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedFaculty.phone}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span><strong className="text-gray-200">Office Hours:</strong> {selectedFaculty.office_hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Availability Status Controls */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181828]/60 p-4 rounded-xl">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Live Presence & Student Availability Toggle
            </h3>
            <p className="text-xs text-gray-400">Update your live status to reflect on student dashboards, digital twin, and directory.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["AVAILABLE", "IN CLASS", "OFFICE HOURS", "UNAVAILABLE"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={currentStatus === status ? "default" : "outline"}
                onClick={() => handleStatusChange(status)}
                className={`text-xs h-8 px-3 transition-all ${
                  currentStatus === status
                    ? "bg-[#A51C30] hover:bg-[#851626] text-white border-none shadow-md shadow-[#A51C30]/20"
                    : "border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Status updated successfully! Synced with student portal and campus directory.
          </div>
        )}
      </Card>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Academic Bio & Qualifications */}
        <div className="md:col-span-2 space-y-6">
          {/* Biography */}
          <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#A51C30]" />
              Academic Biography & Leadership
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              {selectedFaculty.bio}
            </p>
            
            <div className="pt-2 border-t border-white/5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Qualifications</h3>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                {selectedFaculty.qualifications}
              </p>
            </div>
          </Card>

          {/* Teaching Courses & Relational Links */}
          <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A51C30]" />
                Assigned Teaching Load & Courses
              </h2>
              <Link href="/faculty/schedule">
                <Button size="sm" variant="outline" className="text-xs h-7 border-white/10 text-gray-300 hover:text-white">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  View Schedule
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {teachingCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl bg-[#181826] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
                        {course.code}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{course.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400">{course.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-300 sm:text-right">
                    <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      {course.credits} Credits • Sem {course.semester}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      {course.enrolled_student_ids.length} Enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Specializations & Quick Actions */}
        <div className="space-y-6">
          {/* Research Specializations */}
          <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Research & Specializations
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedFaculty.specialization.map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200 font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </Card>

          {/* Quick Management Links */}
          <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-3">
            <h2 className="text-sm font-semibold text-white">Faculty Portals</h2>
            <div className="space-y-2">
              <Link href="/faculty/schedule" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-9 border-white/10 hover:bg-white/5 text-gray-200">
                  <Calendar className="w-4 h-4 mr-2 text-[#A51C30]" />
                  Manage Mon–Fri Timetable
                </Button>
              </Link>
              <Link href="/faculty/classes" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-9 border-white/10 hover:bg-white/5 text-gray-200">
                  <BookOpen className="w-4 h-4 mr-2 text-cyan-400" />
                  Upload Notes & Classroom Slides
                </Button>
              </Link>
              <Link href="/student/campus-hub" className="block">
                <Button variant="outline" className="w-full justify-start text-xs h-9 border-white/10 hover:bg-white/5 text-gray-200">
                  <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                  Explore Somaiya 3D Campus
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
