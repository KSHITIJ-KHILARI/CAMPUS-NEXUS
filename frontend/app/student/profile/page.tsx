"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { api } from "@/lib/api-client";
import {
  type StudentProfile,
  getStoredStudents,
  getStudentById,
  updateStudentPortfolio,
  initialFaculty,
  initialCourses,
  getFacultyLiveAvailability,
} from "@/lib/relationalCampusData";
import {
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  Briefcase,
  Users,
  Github,
  ExternalLink,
  Sparkles,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Percent,
  Calendar,
  Layers,
  Edit3,
  X,
  UserCheck,
} from "lucide-react";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";
import Link from "next/link";

const TABS = ["overview", "academics", "skills", "projects", "internships", "clubs", "certifications"] as const;

export default function ProfilePage() {
  const [studentsList, setStudentsList] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const list = getStoredStudents();
    setStudentsList(list);
    if (list.length > 0) {
      setSelectedStudent(list[0]);
      setEditBio(list[0].bio);
      setEditSkills(list[0].skills.join(", "));
    }
  }, []);

  const handleSelectStudent = (id: string) => {
    const s = getStudentById(id);
    if (s) {
      setSelectedStudent(s);
      setEditBio(s.bio);
      setEditSkills(s.skills.join(", "));
    }
  };

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const skillsArray = editSkills.split(",").map(s => s.trim()).filter(Boolean);
    const updated = updateStudentPortfolio(selectedStudent.student_id, {
      bio: editBio,
      skills: skillsArray,
    });

    setSelectedStudent({ ...updated });
    setIsEditOpen(false);
    setToastMsg("Profile portfolio updated successfully!");
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!selectedStudent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Card className="p-8 text-center bg-[#12121e]/80 border-white/10 text-gray-400">
          Loading student profile records...
        </Card>
      </div>
    );
  }

  // Relational lookups
  const assignedFaculty = initialFaculty.filter(f => selectedStudent.assigned_faculty_ids.includes(f.id));
  const enrolledCourses = initialCourses.filter(c => selectedStudent.enrolled_courses.includes(c.id));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Header: Back button & 5-Student Profile Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />

        {/* 5-Student Seed Profile Selector */}
        <div className="flex items-center gap-3 bg-[#161622] border border-white/10 px-3 py-1.5 rounded-xl">
          <UserCheck className="w-4 h-4 text-[#A51C30]" />
          <span className="text-xs text-gray-400 font-medium">Switch Student Profile:</span>
          <select
            value={selectedStudent.student_id}
            onChange={(e) => handleSelectStudent(e.target.value)}
            className="bg-[#1f1f30] text-sm text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
          >
            {studentsList.map((st) => (
              <option key={st.student_id} value={st.student_id}>
                {st.name} ({st.program.split(" ")[0]} Sem {st.semester})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <Card className="p-6 md:p-8 bg-[#12121e]/90 border-white/10 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#A51C30]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar with Verified Ring */}
          <div className="relative">
            <img
              src={selectedStudent.avatar}
              alt={selectedStudent.full_name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-white/15 shadow-xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#12121e]" title="Verified Student Record">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{selectedStudent.full_name}</h1>
                  <Badge variant="success" className="text-xs">Active Student</Badge>
                </div>
                <p className="text-[#A51C30] font-medium text-sm">
                  {selectedStudent.program} • {selectedStudent.department}
                </p>
              </div>

              <Button
                onClick={() => setIsEditOpen(true)}
                size="sm"
                variant="outline"
                className="text-xs h-8 border-white/10 text-gray-200 hover:text-white"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Portfolio
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Roll Number</span>
                <span className="font-mono text-xs font-bold text-white">{selectedStudent.student_id_number}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Current CGPA</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedStudent.cgpa} / 10.0</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Credits Earned</span>
                <span className="font-mono text-xs font-bold text-blue-400">{selectedStudent.total_credits} Credits</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Attendance</span>
                <span className="font-mono text-xs font-bold text-amber-400">{selectedStudent.attendance_percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#141424] border border-white/10 rounded-2xl">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? "bg-[#A51C30] text-white shadow-md shadow-[#A51C30]/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Student Biography & Focus Area
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {selectedStudent.bio}
              </p>
            </Card>

            {/* Quick Skills */}
            <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A51C30]" />
                Primary Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            {/* Location Privacy */}
            <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#A51C30]" />
                <h3 className="text-sm font-bold text-white">Campus Presence & Privacy</h3>
              </div>
              <LocationTrackingControl />
            </Card>
          </div>

          {/* Right Column: Assigned Faculty Mentors (Relational Bi-directional link!) */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#A51C30]" />
                  Assigned Faculty Mentors
                </h3>
                <Link href="/faculty/profile" className="text-[10px] text-[#A51C30] hover:underline font-medium">
                  Directory →
                </Link>
              </div>

              <div className="space-y-3">
                {assignedFaculty.map((fac) => {
                  const availability = getFacultyLiveAvailability(fac.id);
                  return (
                    <div
                      key={fac.id}
                      className="p-3.5 rounded-xl bg-[#181828] border border-white/5 space-y-2.5 hover:border-white/15 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={fac.avatar}
                            alt={fac.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">{fac.name}</h4>
                            <p className="text-[10px] text-gray-400">{fac.designation} • {fac.department.split(" ")[0]}</p>
                          </div>
                        </div>
                        <Badge
                          variant={availability.badgeVariant}
                          className="text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold whitespace-nowrap shadow-sm"
                        >
                          {availability.text}
                        </Badge>
                      </div>

                      <div className="text-[10px] text-gray-300 space-y-1 pt-1.5 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#A51C30]" /> {fac.office_location}
                          </span>
                          <span className="text-gray-400 font-mono">{fac.phone}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-medium">
                          {availability.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT: ACADEMICS & ATTENDANCE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "academics" && (
        <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Course Attendance Breakdown</h3>
              <p className="text-xs text-gray-400">Subject-wise lecture and laboratory attendance records</p>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Overall: {selectedStudent.attendance_percentage}%
            </span>
          </div>

          <div className="space-y-4">
            {selectedStudent.attendance_history.map((record) => (
              <div key={record.course_id} className="p-4 rounded-xl bg-[#181828] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{record.course_name}</span>
                    <span className="text-gray-400 block text-[10px]">{record.attended_classes} of {record.total_classes} Classes Attended</span>
                  </div>
                  <span className={`font-mono font-bold text-sm ${
                    record.percentage >= 75 ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {record.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      record.percentage >= 75 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${record.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT: SKILLS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "skills" && (
        <Card className="p-6 bg-[#12121e]/80 border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white">Skills & Frameworks</h3>
          <div className="flex flex-wrap gap-2.5">
            {selectedStudent.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:border-[#A51C30] transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT: PROJECTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {selectedStudent.projects.map((proj) => (
            <Card key={proj.id} className="p-6 bg-[#12121e]/80 border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{proj.title}</h3>
                  <p className="text-xs text-gray-400">{proj.role}</p>
                </div>
                {proj.featured && (
                  <Badge variant="success">Featured Project</Badge>
                )}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{proj.description}</p>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="font-mono text-[11px] text-[#A51C30] bg-[#A51C30]/10 border border-[#A51C30]/20 px-2.5 py-1 rounded-md">
                  {proj.tech}
                </span>
              </div>
            </Card>
          ))}
          {selectedStudent.projects.length === 0 && (
            <Card className="p-8 text-center text-xs text-gray-400 border-white/10">No projects added yet.</Card>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT: INTERNSHIPS, CLUBS, CERTIFICATIONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "internships" && (
        <div className="space-y-4">
          {selectedStudent.internships.map((intern) => (
            <Card key={intern.id} className="p-5 bg-[#12121e]/80 border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{intern.role} • {intern.company}</h4>
                <Badge variant="info">{intern.duration}</Badge>
              </div>
              <p className="text-xs text-gray-300">{intern.description}</p>
              <p className="text-[10px] text-gray-500">Location: {intern.location}</p>
            </Card>
          ))}
          {selectedStudent.internships.length === 0 && (
            <Card className="p-8 text-center text-xs text-gray-400 border-white/10">No internships listed.</Card>
          )}
        </div>
      )}

      {activeTab === "clubs" && (
        <div className="space-y-4">
          {selectedStudent.clubs.map((club) => (
            <Card key={club.id} className="p-5 bg-[#12121e]/80 border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{club.name}</h4>
                <Badge variant="secondary">{club.role}</Badge>
              </div>
              <p className="text-xs text-gray-300">{club.description}</p>
              <p className="text-[10px] text-gray-500">{club.duration}</p>
            </Card>
          ))}
          {selectedStudent.clubs.length === 0 && (
            <Card className="p-8 text-center text-xs text-gray-400 border-white/10">No student clubs listed.</Card>
          )}
        </div>
      )}

      {activeTab === "certifications" && (
        <div className="space-y-4">
          {selectedStudent.certifications.map((cert) => (
            <Card key={cert.id} className="p-5 bg-[#12121e]/80 border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{cert.name}</h4>
                <span className="text-xs text-gray-400">{cert.issue_date}</span>
              </div>
              <p className="text-xs text-gray-400">Issuer: {cert.issuer}</p>
              {cert.credential_id && (
                <p className="text-[10px] font-mono text-gray-500">ID: {cert.credential_id}</p>
              )}
            </Card>
          ))}
          {selectedStudent.certifications.length === 0 && (
            <Card className="p-8 text-center text-xs text-gray-400 border-white/10">No certifications listed.</Card>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT PORTFOLIO MODAL */}
      {/* ------------------------------------------------------------- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[#161628] border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Edit Student Portfolio</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePortfolio} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Bio Summary:</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#10101c] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Technical Skills (Comma separated):</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="e.g. Python, PyTorch, ROS2, Docker"
                  className="w-full bg-[#10101c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="text-xs border-white/10 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-[#A51C30] hover:bg-[#851626] text-white font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
