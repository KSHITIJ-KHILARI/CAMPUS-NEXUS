"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

interface EnrollmentRecord {
  id: string;
  student_id: string;
  student_name: string;
  course_section_id: string;
  course: string;
  semester?: string;
  academic_year?: string;
  status: string;
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.admin.getEnrollments(query || undefined);
      setEnrollments(data as EnrollmentRecord[]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to load enrollments.");
      } else {
        setErrorMsg("Something went wrong while loading enrollments.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [query]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg("");
    try {
      await api.admin.createEnrollment({
        student_id: parseInt(formData.get("student_id") as string),
        course_section_id: parseInt(formData.get("course_section_id") as string),
        semester: formData.get("semester") as string,
        academic_year: formData.get("academic_year") as string,
      });
      setSuccessMsg("Enrollment created successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setIsCreateOpen(false);
      fetchEnrollments();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to create enrollment.");
      } else {
        setErrorMsg("Something went wrong while creating enrollment.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;
    setErrorMsg("");
    try {
      await api.admin.deleteEnrollment(id);
      setSuccessMsg("Enrollment removed successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchEnrollments();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to remove enrollment.");
      } else {
        setErrorMsg("Something went wrong while removing enrollment.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Enrollment
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Enrollment Management</h1>
        <p className="text-gray-400">View and manage student course enrollments</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search enrollments by student name or course..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading enrollments...
            </div>
          )}

          {!loading && enrollments.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No enrollments found.</div>
          )}

          {!loading &&
            enrollments.map((enr) => (
              <div
                key={enr.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-white">{enr.student_name}</h3>
                  <p className="text-xs text-gray-400">{enr.course}</p>
                  <p className="text-xs text-gray-400">
                    Semester: {enr.semester || "N/A"} | Year: {enr.academic_year || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={enr.status === "enrolled" ? "success" : "info"}>
                    {enr.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(parseInt(enr.id))}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Add Enrollment</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Student ID</label>
                <Input name="student_id" type="number" required className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Course Section ID</label>
                <Input name="course_section_id" type="number" required className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Semester</label>
                <Input name="semester" placeholder="e.g., 4" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Academic Year</label>
                <Input name="academic_year" placeholder="e.g., 2025-2026" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/10 text-xs text-gray-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl">
                  Add Enrollment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
