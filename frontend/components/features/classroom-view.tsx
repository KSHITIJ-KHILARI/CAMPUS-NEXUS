"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ClassroomMaterial,
  type CourseData,
  initialCourses,
  getStoredMaterials,
  addClassroomMaterial,
  deleteClassroomMaterial,
} from "@/lib/relationalCampusData";
import {
  BookOpen,
  FileText,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  FileCode,
  Layers,
  GraduationCap,
  Calendar,
} from "lucide-react";

interface ClassroomViewProps {
  initialRole?: "student" | "faculty" | "admin";
  defaultCourseId?: string;
}

export function ClassroomView({
  initialRole = "student",
  defaultCourseId = "course-cs301",
}: ClassroomViewProps) {
  const [role, setRole] = useState<"student" | "faculty" | "admin">(initialRole);
  const [courses] = useState<CourseData[]>(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourseId);
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [previewMaterial, setPreviewMaterial] = useState<ClassroomMaterial | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUnit, setUploadUnit] = useState("Unit 3");
  const [uploadType, setUploadType] = useState<"pdf" | "slides" | "notes" | "code">("pdf");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("Choose a PDF, Slide Deck, or Lecture Note");
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [uploadFileSize, setUploadFileSize] = useState<string>("2.4 MB");
  
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadMaterials = () => {
    setMaterials(getStoredMaterials());
  };

  useEffect(() => {
    loadMaterials();
    const handleUpdate = () => loadMaterials();
    window.addEventListener("nexus-materials-updated", handleUpdate);
    return () => window.removeEventListener("nexus-materials-updated", handleUpdate);
  }, []);

  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (m.course_id !== selectedCourseId && m.course_code !== selectedCourse?.code) return false;
      if (unitFilter !== "all" && m.unit !== unitFilter) return false;
      if (typeFilter !== "all" && m.file_type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!m.title.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [materials, selectedCourseId, selectedCourse, unitFilter, typeFilter, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    if (file.size < 1024 * 1024) {
      setUploadFileSize((file.size / 1024).toFixed(1) + " KB");
    } else {
      setUploadFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
    }

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".pdf")) setUploadType("pdf");
    else if (lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")) setUploadType("slides");
    else if (lowerName.endsWith(".py") || lowerName.endsWith(".java") || lowerName.endsWith(".cpp") || lowerName.endsWith(".js") || lowerName.endsWith(".ts")) setUploadType("code");
    else setUploadType("notes");

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = (loadEvt.target?.result as string) || "";
      setFileDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    addClassroomMaterial({
      course_id: selectedCourse.id,
      course_code: selectedCourse.code,
      title: uploadTitle,
      description: uploadDesc || "Official curriculum study material provided by faculty.",
      unit: uploadUnit,
      file_type: uploadType,
      file_size: uploadFileSize,
      file_url: fileDataUrl || "#",
      uploaded_by_faculty_id: selectedCourse.faculty_id,
      uploaded_by_name: selectedCourse.code === "CS301" ? "Dr. Jane Smith" : "Prof. Ramesh Iyer",
      preview_text: uploadPreview || uploadDesc || `Uploaded course material: ${uploadedFileName}`,
    });

    setIsUploadOpen(false);
    setUploadTitle("");
    setUploadDesc("");
    setUploadPreview("");
    setFileDataUrl("");
    setUploadedFileName("Choose a PDF, Slide Deck, or Lecture Note");
    setFeedback(`Study material '${uploadTitle}' published successfully! Enrolled students notified.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDelete = (id: string) => {
    deleteClassroomMaterial(id);
    setFeedback("Material deleted.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDownload = (material: ClassroomMaterial) => {
    if (material.file_url && material.file_url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = material.file_url;
      const ext = material.file_type === "pdf" ? ".pdf" : material.file_type === "slides" ? ".pptx" : material.file_type === "code" ? ".txt" : ".pdf";
      a.download = `${material.title.replace(/\s+/g, "_")}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setFeedback(`Downloading ${material.title}...`);
    } else {
      setFeedback(`Downloaded reference copy of ${material.title} (${material.file_size}).`);
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <Card className="p-6 md:p-8 bg-[#12121e]/90 border-white/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#A51C30]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Classroom Academic Hub
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Centralized repository for syllabus notes, official faculty slide decks, lab manuals, and revision guides. View in-browser previews or download for offline study.
            </p>
          </div>

          {/* Role Toggle & Upload Action */}
          <div className="flex flex-wrap items-center gap-3">
            {(initialRole === "faculty" || initialRole === "admin") && (
              <div className="flex items-center bg-[#181828] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setRole("faculty")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    role === "faculty" ? "bg-[#A51C30] text-white shadow-sm" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Faculty Mode
                </button>
                <button
                  onClick={() => setRole("student")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    role === "student" ? "bg-[#A51C30] text-white shadow-sm" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student View
                </button>
              </div>
            )}

            {(role === "faculty" || initialRole === "faculty" || initialRole === "admin") && (
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="bg-[#A51C30] hover:bg-[#851626] text-white text-xs h-9 rounded-xl shadow-lg shadow-[#A51C30]/25"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Upload Course Materials
              </Button>
            )}
          </div>
        </div>

        {/* Course Tabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-white/10 pb-1">
          {courses.map((c) => {
            const isSelected = selectedCourseId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-[#A51C30] text-white border-[#A51C30] shadow-md shadow-[#A51C30]/20"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="font-mono">{c.code}</span>
                <span>{c.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Course Info Bar */}
      <Card className="p-4 bg-[#151524] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#A51C30]/20 text-[#A51C30] border border-[#A51C30]/30">
            {selectedCourse.code}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">{selectedCourse.name}</h3>
            <p className="text-xs text-gray-400">{selectedCourse.department} • {selectedCourse.credits} Credits</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            Semester {selectedCourse.semester}
          </span>
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            {selectedCourse.enrolled_student_ids.length} Students Enrolled
          </span>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[#12121e]/80 border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#181828] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
            />
          </div>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-[#181828] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Syllabus Units</option>
            <option value="Unit 1">Unit 1: Foundations</option>
            <option value="Unit 2">Unit 2: Intermediate Architecture</option>
            <option value="Unit 3">Unit 3: Advanced Optimization</option>
            <option value="Unit 4">Unit 4: Systems & Distributed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#181828] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Document Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="slides">Faculty Slide Decks</option>
            <option value="notes">Revision Notes</option>
            <option value="code">Lab Code Tutorials</option>
          </select>
        </div>
      </Card>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((mat) => {
          const isPdf = mat.file_type === "pdf";
          const isSlides = mat.file_type === "slides";
          const isCode = mat.file_type === "code";

          return (
            <Card
              key={mat.id}
              className="p-5 bg-[#141424] border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl text-xs font-bold ${
                      isPdf ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      isSlides ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      isCode ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {isPdf ? <FileText className="w-4 h-4" /> :
                       isSlides ? <Layers className="w-4 h-4" /> :
                       isCode ? <FileCode className="w-4 h-4" /> :
                       <BookOpen className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#A51C30] uppercase">
                        {mat.unit} • {mat.file_type.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug">{mat.title}</h4>
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                    {mat.file_size}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-300 line-clamp-2">
                  {mat.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                  <span>Uploaded by: <strong className="text-gray-200">{mat.uploaded_by_name}</strong></span>
                  <span>{mat.upload_date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewMaterial(mat)}
                  className="text-xs h-8 border-white/10 text-gray-200 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  In-Browser Preview
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(mat)}
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>

                  {role === "faculty" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(mat.id)}
                      className="text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 p-2"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <Card className="p-12 text-center bg-[#12121e]/60 border-white/10 space-y-2">
          <BookOpen className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No materials found for this course</h3>
          <p className="text-xs text-gray-400">Switch unit filters or click "Upload Course Materials" in faculty mode to add notes.</p>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* IN-BROWSER PREVIEW MODAL */}
      {/* ------------------------------------------------------------- */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-2xl p-6 bg-[#161628] border-white/15 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="font-mono text-xs font-bold text-[#A51C30]">
                  {previewMaterial.course_code} • {previewMaterial.unit}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{previewMaterial.title}</h3>
                <p className="text-xs text-gray-400">
                  Uploaded by {previewMaterial.uploaded_by_name} • {previewMaterial.upload_date}
                </p>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Content View */}
            <div className="bg-[#10101c] p-5 rounded-xl border border-white/10 space-y-4 max-h-[440px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-2">
                <span>Somaiya Vidyavihar University Document Viewer</span>
                <span className="uppercase font-mono">{previewMaterial.file_type} • {previewMaterial.file_size}</span>
              </div>

              <div className="space-y-3 text-sm text-gray-200 leading-relaxed font-sans">
                <p className="font-medium text-white">{previewMaterial.description}</p>
                
                {previewMaterial.file_url?.startsWith("data:application/pdf") ? (
                  <iframe
                    src={previewMaterial.file_url}
                    className="w-full h-[360px] rounded-xl border border-white/10 bg-white/5"
                    title={previewMaterial.title}
                  />
                ) : previewMaterial.file_url?.startsWith("data:image/") ? (
                  <img
                    src={previewMaterial.file_url}
                    alt={previewMaterial.title}
                    className="max-h-[360px] mx-auto rounded-xl object-contain border border-white/10"
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 font-mono leading-normal whitespace-pre-wrap">
                    {previewMaterial.preview_text || "Document preview content rendering..."}
                  </div>
                )}
                
                <p className="text-xs text-gray-400 italic">
                  End of in-browser preview. Click 'Download Full Document' below for offline local access.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-gray-400">Official Department Curriculum Copy</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMaterial(null)}
                  className="text-xs border-white/10 text-gray-300"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownload(previewMaterial)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download Full Document
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FACULTY UPLOAD MODAL */}
      {/* ------------------------------------------------------------- */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[#161628] border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A51C30]">
                <UploadCloud className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Upload Course Material</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Target Course:</label>
                <div className="p-2.5 bg-[#10101c] border border-white/10 rounded-xl text-xs text-white font-mono">
                  {selectedCourse.code}: {selectedCourse.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Document Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Unit 4: ACID Concurrency & Distributed Recovery"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#10101c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Curriculum Unit:</label>
                  <select
                    value={uploadUnit}
                    onChange={(e) => setUploadUnit(e.target.value)}
                    className="w-full bg-[#10101c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Unit 1">Unit 1: Foundations</option>
                    <option value="Unit 2">Unit 2: Architecture</option>
                    <option value="Unit 3">Unit 3: Optimization</option>
                    <option value="Unit 4">Unit 4: Advanced Systems</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Format Type:</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full bg-[#10101c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slides">Slide Deck (.pptx)</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="code">Lab Code Tutorial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Briefly explain what concepts and theorems this note covers..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full bg-[#10101c] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>

              {/* Functional Drag & Drop / File Selector */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    setUploadedFileName(file.name);
                    if (!uploadTitle.trim()) {
                      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                    if (file.size < 1024 * 1024) {
                      setUploadFileSize((file.size / 1024).toFixed(1) + " KB");
                    } else {
                      setUploadFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
                    }
                    const lowerName = file.name.toLowerCase();
                    if (lowerName.endsWith(".pdf")) setUploadType("pdf");
                    else if (lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")) setUploadType("slides");
                    else setUploadType("notes");

                    const reader = new FileReader();
                    reader.onload = (loadEvt) => {
                      setFileDataUrl((loadEvt.target?.result as string) || "");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="p-5 rounded-xl border-2 border-dashed border-[#A51C30]/40 hover:border-[#A51C30] bg-[#A51C30]/5 hover:bg-[#A51C30]/10 text-center space-y-2 cursor-pointer transition-all group"
              >
                <UploadCloud className="w-7 h-7 text-[#A51C30] mx-auto group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs text-white font-semibold">{uploadedFileName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click or drag & drop real PDF, Slide Deck, or image file</p>
                </div>
                <Badge variant="success" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  Ready to upload & share with students
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-xs border-white/10 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-[#A51C30] hover:bg-[#851626] text-white font-bold px-4"
                >
                  Publish to Classroom
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
