"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  DoorOpen, 
  BookOpen, 
  FileText, 
  Plus, 
  UploadCloud, 
  Download, 
  Trash2, 
  ExternalLink,
  GraduationCap,
  Building2,
  Sparkles,
  Search,
  Eye,
  CheckCircle2,
  Layers
} from "lucide-react";
import { api } from "@/lib/api-client";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";
import { ChangeRoomModal } from "@/components/campus/ChangeRoomModal";
import { IssueReportModal } from "@/components/campus/IssueReportModal";
import { 
  getStoredCourses, 
  addCourse, 
  getStoredMaterials, 
  addClassroomMaterial, 
  deleteClassroomMaterial, 
  getVacantRoomsStatus,
  addCentralNotification,
  type CourseData,
  type ClassroomMaterial,
  type RoomVacancyInfo
} from "@/lib/relationalCampusData";
import { StaggerContainer, FadeUp } from "@/components/ui/motion-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ScheduleEntry {
  id: number | string;
  day?: string;
  day_of_week?: string;
  start?: string;
  start_time?: string;
  end?: string;
  end_time?: string;
  time?: string;
  course?: string;
  course_name?: string;
  course_code?: string;
  section?: string;
  room?: string;
  room_number?: string;
  type?: string;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  semester: number | null;
  cgpa: number | null;
  program_name: string | null;
}

interface ClassDetails {
  schedule: ScheduleEntry;
  students: Student[];
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [currentRoom, setCurrentRoom] = useState("CSB 302");
  const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);

  // Section 21: Subjects, Class Notes, Vacant Rooms State
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [vacantRooms, setVacantRooms] = useState<RoomVacancyInfo[]>([]);

  // Add Course Modal State
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDept, setNewCourseDept] = useState("Computer Engineering");
  const [newCourseSem, setNewCourseSem] = useState(4);
  const [newCourseCredits, setNewCourseCredits] = useState(4);

  // Upload Class Note Modal State
  const [uploadNoteModalOpen, setUploadNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCourseId, setNoteCourseId] = useState("");
  const [noteType, setNoteType] = useState<"notes" | "slides" | "syllabus" | "assignment">("notes");
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteFileDataUrl, setNoteFileDataUrl] = useState<string>("");
  const [previewMaterial, setPreviewMaterial] = useState<ClassroomMaterial | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, studRes] = await Promise.all([
          api.faculty.getSchedule().catch(() => ({ entries: [] })),
          api.faculty.getStudents().catch(() => []),
        ]);
        setScheduleData((schedRes.entries || []) as unknown as ScheduleEntry[]);
        setStudents((studRes || []) as unknown as Student[]);
      } catch (err) {
        console.error("Failed to fetch faculty data:", err);
      }

      // Load relational subjects, materials, and vacant rooms
      const storedCourses = getStoredCourses();
      setCourses(storedCourses);
      if (storedCourses.length > 0 && !noteCourseId) {
        setNoteCourseId(storedCourses[0].id);
      }

      setMaterials(getStoredMaterials());
      setVacantRooms(getVacantRoomsStatus("Monday", "10:30"));
    };

    fetchData();

    const handleTimetableUpdate = () => {
      setVacantRooms(getVacantRoomsStatus("Monday", "10:30"));
    };
    window.addEventListener("nexus-timetable-updated", handleTimetableUpdate);
    return () => window.removeEventListener("nexus-timetable-updated", handleTimetableUpdate);
  }, []);

  const headerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAP(() => {
    if (prefersReduced || !headerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(
      headerRef.current.querySelector(".faculty-header-badge"),
      { opacity: 0, y: 10, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4 }
    )
    .fromTo(
      headerRef.current.querySelector("h1"),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5 },
      "-=0.2"
    )
    .fromTo(
      headerRef.current.querySelector("p"),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.25"
    )
    .fromTo(
      headerRef.current.querySelectorAll(".faculty-header-btn"),
      { opacity: 0, scale: 0.92, y: 6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.08 },
      "-=0.2"
    );
  }, { scope: headerRef, dependencies: [prefersReduced] });

  const viewDetails = (entry: ScheduleEntry) => {
    setSelectedClass({ schedule: entry, students });
    setDetailsModalOpen(true);
  };

  // Schedule fallback
  const displaySchedule = scheduleData.length > 0
    ? scheduleData
    : [
        { id: 1, day: "Today", start: "10:00 AM", end: "11:30 AM", course: "SY B.Tech - Data Structures & Algorithms", section: "A", room: currentRoom, type: "lecture" },
        { id: 2, day: "Today", start: "2:00 PM", end: "3:30 PM", course: "SY B.Tech - Database Management Systems", section: "B", room: currentRoom, type: "lecture" },
      ];

  // Handle Add Subject/Course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseName) return;

    const created = addCourse({
      code: newCourseCode.toUpperCase().trim(),
      name: newCourseName.trim(),
      department: newCourseDept,
      semester: Number(newCourseSem),
      credits: Number(newCourseCredits),
      faculty_id: "fac-smith",
      description: `${newCourseDept} Core Subject`,
      enrolled_student_ids: ["stu-101", "stu-102", "stu-103", "stu-104"],
      color: "#A51C30",
    });

    setCourses(getStoredCourses());
    setAddCourseModalOpen(false);
    setNewCourseCode("");
    setNewCourseName("");

    addCentralNotification({
      title: `New Subject Added: ${created.code}`,
      message: `${created.name} was successfully registered for ${created.department} (Sem ${created.semester}).`,
      type: "system",
    });
  };

  // Handle File Input Change for Class Note
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNoteFile(file);
      if (!noteTitle) {
        setNoteTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setNoteFileDataUrl(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Upload Class Note
  const handleUploadClassNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteCourseId) return;

    const selectedCourse = courses.find((c) => c.id === noteCourseId) || courses[0];
    const sizeStr = noteFile ? `${(noteFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.8 MB";
    const mappedFileType: "pdf" | "slides" | "notes" | "code" =
      noteType === "slides" ? "slides" : noteType === "notes" ? "notes" : "pdf";

    const newMat = addClassroomMaterial({
      course_id: selectedCourse.id,
      course_code: selectedCourse.code,
      title: noteTitle.trim(),
      description: `Uploaded by Dr. Priya Sharma for ${selectedCourse.code} lectures.`,
      unit: "Unit 1",
      file_type: mappedFileType,
      file_url: noteFileDataUrl || "/sample-materials/notes.pdf",
      file_size: sizeStr,
      uploaded_by_faculty_id: "fac-smith",
      uploaded_by_name: "Dr. Priya Sharma",
    });

    setMaterials(getStoredMaterials());
    setUploadNoteModalOpen(false);
    setNoteTitle("");
    setNoteFile(null);
    setNoteFileDataUrl("");

    addCentralNotification({
      title: `Notes Uploaded: ${selectedCourse.code}`,
      message: `"${newMat.title}" is now available to enrolled students in the Classroom portal.`,
      type: "material",
    });
  };

  const handleDeleteMaterial = (id: string) => {
    deleteClassroomMaterial(id);
    setMaterials(getStoredMaterials());
  };

  return (
    <>
      <StaggerContainer className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <FadeUp>
          <div ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-[#A51C30]/20 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div>
              <div className="faculty-header-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Faculty Workspace • Academic Year 2026-27
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Faculty Intelligence Control</h1>
              <p className="text-neutral-400 text-sm mt-1">
                Welcome back, <strong>Dr. Priya Sharma</strong> | Department of Computer Engineering & Information Technology
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setAddCourseModalOpen(true)}
                className="faculty-header-btn bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-white/10 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Subject
              </Button>
              <Button
                onClick={() => setUploadNoteModalOpen(true)}
                className="faculty-header-btn bg-[#A51C30] hover:bg-[#851626] text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all hover:scale-105 active:scale-95"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Class Note
              </Button>
            </div>
          </div>
        </FadeUp>

        {/* Today's Schedule */}
        <FadeUp>
          <Card className="dashboard-card bg-neutral-900/60 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-500" />
                Today&apos;s Active Lecture Schedule
              </h2>
              <Button
                size="sm"
                onClick={() => setIsChangeRoomOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <DoorOpen className="w-3.5 h-3.5" /> Reassign Classroom
              </Button>
            </div>

            <div className="space-y-3">
              {displaySchedule.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border flex items-start justify-between transition-all duration-200 hover:translate-y-[-1px] ${
                    entry.type === "lab"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`h-4 w-4 ${entry.type === "lecture" ? "text-neutral-400" : "text-red-400"}`} />
                      <span className={`text-sm ${entry.type === "lecture" ? "text-neutral-400" : "text-red-400 font-semibold"}`}>
                        {(entry.start || entry.start_time || "10:00 AM")} - {(entry.end || entry.end_time || "11:30 AM")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">
                      {entry.course || (entry.course_code ? `${entry.course_code} — ${entry.course_name}` : entry.course_name) || "Academic Lecture"}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <MapPin className="h-3.5 w-3.5 text-red-400" /> {entry.room || entry.room_number || "Room TBA"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <Users className="h-3.5 w-3.5 text-blue-400" /> {students.length || 64} Students Enrolled
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={entry.type === "lecture" ? "bg-white/10 text-neutral-300" : "bg-blue-600/20 text-blue-400"}>
                      {entry.type === "lecture" ? "Scheduled" : "Lab Session"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewDetails(entry)}
                      className="text-xs text-neutral-400 hover:text-white hover:bg-white/10 h-7 px-2"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>

        {/* SECTION 21: SUBJECTS & CURRICULUM */}
        <FadeUp>
          <Card className="dashboard-card bg-neutral-900/60 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-400" />
                  Subjects & Course Allocation ({courses.length})
                </h2>
                <p className="text-xs text-neutral-400">Assigned courses and syllabus tracks under your faculty account</p>
              </div>
              <Button
                size="sm"
                onClick={() => setAddCourseModalOpen(true)}
                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Subject
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all duration-200 hover:translate-y-[-1px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                        {c.code}
                      </Badge>
                      <span className="text-[11px] text-neutral-400">Sem {c.semester} • {c.credits} Credits</span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{c.name}</h4>
                    <p className="text-xs text-neutral-400 mt-1 truncate">{c.department}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-neutral-500" />
                      {c.enrolled_student_ids?.length || 64} Students
                    </span>
                    <button
                      onClick={() => router.push("/faculty/classroom")}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      Classroom <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>

        {/* SECTION 21: CLASS NOTES & MATERIALS */}
        <FadeUp>
          <Card className="dashboard-card bg-neutral-900/60 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Class Notes & Shared Materials ({materials.length})
                </h2>
                <p className="text-xs text-neutral-400">Recent lecture notes, syllabus decks, and files shared with students</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setUploadNoteModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload Class Note
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/faculty/classroom")}
                  className="border-white/10 text-neutral-300 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all"
                >
                  Open Full Classroom
                </Button>
              </div>
            </div>

            {materials.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-white/10 text-center space-y-2">
                <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm text-neutral-400">No notes uploaded yet. Click &quot;Upload Class Note&quot; to publish your first syllabus or lecture file.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {materials.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all duration-200 hover:translate-y-[-1px] flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold text-white truncate">{m.title}</h4>
                        <p className="text-xs text-neutral-400 truncate">{m.course_code}</p>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
                          <span className="uppercase font-mono font-semibold text-neutral-400">{m.file_type}</span>
                          <span>•</span>
                          <span>{m.file_size}</span>
                          <span>•</span>
                          <span>{m.upload_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewMaterial(m)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </FadeUp>

        {/* SECTION 21: VACANT ROOMS OVERVIEW */}
        <FadeUp>
          <Card className="dashboard-card bg-neutral-900/60 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-amber-400" />
                  Live Vacant Rooms & Labs
                </h2>
                <p className="text-xs text-neutral-400">Available halls across Somaiya campus ready for extra classes or lab sessions</p>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/faculty/rooms")}
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                View All Vacant Rooms <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {vacantRooms.slice(0, 4).map((vr) => (
                <div
                  key={vr.room.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all duration-200 hover:translate-y-[-1px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                        {vr.room.room_number}
                      </Badge>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Vacant
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">{vr.room.name}</h4>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-neutral-500" /> {vr.room.building_name}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                    <span>Cap: {vr.room.capacity}</span>
                    <span className="text-neutral-500">Floor {vr.room.floor}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeUp>

        {/* Equipment Status & Privacy Controls */}
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="dashboard-card bg-neutral-900/60 border-white/10">
              <h2 className="text-sm font-semibold text-white mb-3">Room Equipment Status ({currentRoom})</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Projector
                  </div>
                  <p className="font-medium text-white">Operational</p>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Air Conditioning
                  </div>
                  <p className="font-medium text-white">Active (22°C)</p>
                </div>
              </div>
            </Card>

            <Card className="dashboard-card bg-neutral-900/60 border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-semibold text-white">Location Privacy Control</h2>
              </div>
              <LocationTrackingControl />
            </Card>
          </div>
        </FadeUp>
      </StaggerContainer>

      {/* MODALS */}
      <ChangeRoomModal
        isOpen={isChangeRoomOpen}
        onClose={() => setIsChangeRoomOpen(false)}
        onSuccess={(newRoomName) => setCurrentRoom(newRoomName)}
      />

      <IssueReportModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />

      {/* Add Subject / Course Modal */}
      <AnimatePresence>
        {addCourseModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="bg-neutral-950 border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Add New Subject</h3>
                    <p className="text-xs text-neutral-400">Register a new course under your faculty profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddCourseModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-401"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Course Title / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Cloud Computing"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Semester</label>
                    <select
                      value={newCourseSem}
                      onChange={(e) => setNewCourseSem(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Credits</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newCourseCredits}
                      onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Department</label>
                  <select
                    value={newCourseDept}
                    onChange={(e) => setNewCourseDept(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                    <option value="Electronics & Telecommunication">Electronics & Telecom</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddCourseModalOpen(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 rounded-xl"
                  >
                    Save Subject
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Class Note Modal */}
      <AnimatePresence>
        {uploadNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="bg-neutral-950 border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Upload Class Notes</h3>
                    <p className="text-xs text-neutral-400">Share documents, PDFs, or slides with your students</p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadNoteModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadClassNote} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Target Subject / Course</label>
                  <select
                    value={noteCourseId}
                    onChange={(e) => setNoteCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 4: Graph Algorithms & Minimum Spanning Trees"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Material Type</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="notes">Lecture Notes (PDF / DOCX)</option>
                    <option value="slides">Presentation Slides (PPTX / PDF)</option>
                    <option value="syllabus">Syllabus & Course Outline</option>
                    <option value="assignment">Assignment & Problem Set</option>
                  </select>
                </div>

                {/* Real File Input Area */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Select File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/5"
                  >
                    <UploadCloud className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                    {noteFile ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">{noteFile.name}</p>
                        <p className="text-xs text-neutral-400">{(noteFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-neutral-300">Click to choose PDF or document</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Supports PDF, DOCX, PPTX, Images</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setUploadNoteModalOpen(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 rounded-xl"
                  >
                    Publish to Students
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material In-Browser Preview Modal */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="bg-neutral-950 border border-white/15 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">{previewMaterial.title}</h3>
                    <p className="text-xs text-neutral-400">{previewMaterial.course_code} • {previewMaterial.file_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-[350px] bg-neutral-900 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-4">
                {previewMaterial.file_url.startsWith("data:image/") ? (
                  <img
                    src={previewMaterial.file_url}
                    alt={previewMaterial.title}
                    className="max-h-[450px] max-w-full object-contain rounded-lg shadow-lg"
                  />
                ) : previewMaterial.file_url.startsWith("data:application/pdf") ? (
                  <iframe
                    src={previewMaterial.file_url}
                    className="w-full h-full min-h-[450px] rounded-lg border-0"
                    title={previewMaterial.title}
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <FileText className="w-16 h-16 text-neutral-600 mx-auto" />
                    <p className="text-sm text-neutral-300 font-semibold">{previewMaterial.title}</p>
                    <p className="text-xs text-neutral-500">Document ready for download.</p>
                    <a
                      href={previewMaterial.file_url}
                      download={`${previewMaterial.title}.pdf`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-neutral-400">Uploaded {previewMaterial.upload_date}</span>
                <Button
                  variant="ghost"
                  onClick={() => setPreviewMaterial(null)}
                  className="text-xs text-neutral-300 hover:text-white"
                >
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Details Modal */}
      {selectedClass && (
        <Modal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Class Details"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {selectedClass.schedule.course || (selectedClass.schedule.course_code ? `${selectedClass.schedule.course_code} — ${selectedClass.schedule.course_name}` : selectedClass.schedule.course_name) || "Academic Lecture"}
              </h3>
              <p className="text-sm text-neutral-400">
                Section {selectedClass.schedule.section || "A"} • {selectedClass.schedule.type || "lecture"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-neutral-500">Faculty</p>
                <p className="text-sm font-medium text-white">Dr. Priya Sharma</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-neutral-500">Day</p>
                <p className="text-sm font-medium text-white">{selectedClass.schedule.day || selectedClass.schedule.day_of_week || "Monday"}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-neutral-500">Time</p>
                <p className="text-sm font-medium text-white">
                  {(selectedClass.schedule.start || selectedClass.schedule.start_time || "10:00 AM")} - {(selectedClass.schedule.end || selectedClass.schedule.end_time || "11:30 AM")}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-neutral-500">Room / Lab</p>
                <p className="text-sm font-medium text-white">{selectedClass.schedule.room || selectedClass.schedule.room_number || "Room TBA"}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Enrolled Students ({selectedClass.students?.length || 64})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(selectedClass.students ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{s.full_name}</p>
                      <p className="text-xs text-neutral-500">
                        Roll: {s.roll_number || "N/A"} • {s.email}
                      </p>
                    </div>
                    <div className="text-right">
                      {s.cgpa !== null && (
                        <Badge variant="info" className="text-xs">CGPA: {s.cgpa}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
