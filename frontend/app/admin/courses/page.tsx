"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

interface CourseRecord {
  id: string;
  code: string;
  name: string;
  credits: number;
  department?: string;
  program?: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.admin.getCourses(query || undefined);
      setCourses(data as CourseRecord[]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to load courses.");
      } else {
        setErrorMsg("Something went wrong while loading courses.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [query]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg("");
    try {
      await api.admin.createCourse({
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        credits: parseInt(formData.get("credits") as string) || 3,
      });
      setSuccessMsg("Course created successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setIsCreateOpen(false);
      fetchCourses();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to create course.");
      } else {
        setErrorMsg("Something went wrong while creating course.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    setErrorMsg("");
    try {
      await api.admin.deleteCourse(id);
      setSuccessMsg("Course deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchCourses();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to delete course.");
      } else {
        setErrorMsg("Something went wrong while deleting course.");
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
          <Plus className="w-4 h-4" /> Add Course
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Course Management</h1>
        <p className="text-gray-400">View and manage campus courses</p>
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
          placeholder="Search courses by code or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading courses...
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No courses found.</div>
          )}

          {!loading &&
            courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-white">{course.code} - {course.name}</h3>
                  <p className="text-xs text-gray-400">
                    {course.credits} Credits | {course.department || "N/A"} | {course.program || "N/A"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(parseInt(course.id))}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            ))}
        </div>
      </Card>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Add New Course</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Course Code</label>
                <Input name="code" required className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Course Name</label>
                <Input name="name" required className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Credits</label>
                <Input name="credits" type="number" defaultValue="3" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/10 text-xs text-gray-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl">
                  Create Course
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
