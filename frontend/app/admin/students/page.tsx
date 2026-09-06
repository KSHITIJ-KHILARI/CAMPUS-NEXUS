"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit3, Trash2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { AddStudentModal } from "@/components/campus/AddStudentModal";

import { useDebounce } from "@/hooks/use-debounce";

interface StudentRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  roll_number?: string;
  program?: string;
  department?: string;
  semester?: number;
  cgpa?: number;
  is_active: boolean;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.admin.getStudents(debouncedQuery || undefined);
      setStudents(data as StudentRecord[]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to load students.");
      } else {
        setErrorMsg("Something went wrong while loading students.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [debouncedQuery]);

  const handleUpdate = async (id: string, data: any) => {
    setErrorMsg("");
    try {
      await api.admin.updateStudent(id, data);
      setSuccessMsg("Student updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setIsEditOpen(false);
      setEditing(null);
      fetchStudents();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to update student.");
      } else {
        setErrorMsg("Something went wrong while updating student.");
      }
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this student? This deactivates the account but preserves all records.")) return;
    setArchivingId(id);
    setErrorMsg("");
    try {
      await api.admin.deleteStudent(id);
      setSuccessMsg("Student archived successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchStudents();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to archive student.");
      } else {
        setErrorMsg("Something went wrong while archiving student.");
      }
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Student Management</h1>
        <p className="text-gray-400">View and manage student academic records</p>
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
          placeholder="Search students by name, email, or roll number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading students...
            </div>
          )}

          {!loading && students.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No students found.</div>
          )}

          {!loading &&
            students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
                    {student.full_name?.[0] || student.email[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{student.full_name}</h3>
                    <p className="text-xs text-gray-400">{student.email}</p>
                    <p className="text-xs text-gray-400">
                      {student.roll_number} | {student.program || "N/A"} | Semester {student.semester || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={student.is_active ? "success" : "danger"}>
                    {student.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditing(student); setIsEditOpen(true); }}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {student.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(student.id)}
                      disabled={archivingId === student.id}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>

      <AddStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onStudentAdded={fetchStudents}
      />

      {isEditOpen && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Edit Student</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdate(editing.id, {
                  roll_number: formData.get("roll_number") as string,
                  current_semester: parseInt(formData.get("current_semester") as string) || undefined,
                  cgpa: parseFloat(formData.get("cgpa") as string) || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-400 block mb-1">Roll Number</label>
                <Input name="roll_number" defaultValue={editing.roll_number || ""} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Semester</label>
                <Input name="current_semester" type="number" defaultValue={editing.semester || ""} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">CGPA</label>
                <Input name="cgpa" type="number" step="0.01" defaultValue={editing.cgpa || ""} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditing(null); }} className="border-white/10 text-xs text-gray-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl">
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