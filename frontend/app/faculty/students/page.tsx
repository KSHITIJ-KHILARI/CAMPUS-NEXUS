"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Eye, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { StudentDetailsModal } from "@/components/campus/StudentDetailsModal";

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<any[]>("/faculty/students");
        setStudents(data || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load student roster");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Enrolled Course Roster</h1>
        <p className="text-gray-400">View permitted student details for your active courses in Computer Science</p>
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading student roster...
            </div>
          )}

          {error && !loading && (
            <div className="p-8 text-center">
              <p className="text-sm text-campus-red mb-3">{error}</p>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && students.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No students enrolled in your course sections.</div>
          )}

          {!loading &&
            students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
                    {student.full_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{student.full_name}</h3>
                    <p className="text-xs text-gray-400">Roll: {student.roll_number || "1012023001"} | Email: {student.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">Sem {student.semester || 5}</p>
                    <p className="text-xs text-gray-400">GPA: {student.cgpa || 8.9}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedStudent(student)}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> See Student
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
