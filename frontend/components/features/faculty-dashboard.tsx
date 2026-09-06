"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Calendar, Clock, Users, MapPin, AlertTriangle, CheckCircle, DoorOpen, BookOpen } from "lucide-react";
import { api } from "@/lib/api-client";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";
import { ChangeRoomModal } from "@/components/campus/ChangeRoomModal";
import { IssueReportModal } from "@/components/campus/IssueReportModal";

interface ScheduleEntry {
  id: number;
  day: string;
  start: string;
  end: string;
  course: string;
  section: string;
  room: string;
  type: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, studRes] = await Promise.all([
          api.faculty.getSchedule(),
          api.faculty.getStudents(),
        ]);
        setScheduleData(schedRes.schedule || []);
        setStudents(studRes || []);
      } catch (err) {
        console.error("Failed to fetch faculty data:", err);
      }
    };
    fetchData();
  }, []);

  const viewDetails = (entry: ScheduleEntry) => {
    setSelectedClass({ schedule: entry, students });
    setDetailsModalOpen(true);
  };

  // Use real schedule data, fall back to hardcoded display for UI if empty
  const displaySchedule = scheduleData.length > 0
    ? scheduleData
    : [
        { id: 1, day: "Today", start: "10:00 AM", end: "11:30 AM", course: "SY B.Tech - Data Structures & Algorithms", section: "A", room: currentRoom, type: "lecture" },
        { id: 2, day: "Today", start: "2:00 PM", end: "3:30 PM", course: "SY B.Tech - Database Management Systems", section: "B", room: currentRoom, type: "lecture" },
      ];

  const isUpcoming = (entry: ScheduleEntry) => {
    const now = new Date();
    const startStr = `${entry.day} ${entry.start}`;
    const start = new Date(startStr);
    return start > now;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Faculty Intelligence Control</h1>
          <p className="text-gray-400">Welcome back, Dr. Priya Sharma | Department of Computer Science</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-500" />
            Today&apos;s Active Lecture Schedule
          </h2>
          <Button
            size="sm"
            onClick={() => setIsChangeRoomOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <DoorOpen className="w-3.5 h-3.5" /> Reassign Classroom
          </Button>
        </div>

        <div className="space-y-3">
          {displaySchedule.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border flex items-start justify-between ${
                entry.type === "lab"
                  ? "bg-blue-500/10 border-blue-500/20"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`h-4 w-4 ${entry.type === "lecture" ? "text-gray-400" : "text-red-400"}`} />
                  <span className={`text-sm ${entry.type === "lecture" ? "text-gray-400" : "text-red-400 font-semibold"}`}>
                    {entry.start} - {entry.end}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{entry.course}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-red-400" /> {entry.room}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3.5 w-3.5 text-blue-400" /> {students.length} Students Enrolled
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={entry.type === "lecture" ? "default" : "info"}>
                  {entry.type === "lecture" ? "Completed" : "Upcoming"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => viewDetails(entry)}
                  className="text-xs text-gray-400 hover:text-white hover:bg-white/5 h-7 px-2"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Room Status */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Assigned Room Equipment Status ({currentRoom})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Projector</span>
            </div>
            <p className="text-sm font-medium text-white">Operational</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Air Conditioning</span>
            </div>
            <p className="text-sm font-medium text-white">Cooling (22°C)</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Wi-Fi Access Point</span>
            </div>
            <p className="text-sm font-medium text-white">High Speed</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Podium Mic</span>
            </div>
            <p className="text-sm font-medium text-white">Available</p>
          </div>
        </div>
      </Card>

      {/* Location Tracking */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-campus-primary" />
          <h2 className="text-lg font-semibold text-white">Location Privacy</h2>
        </div>
        <LocationTrackingControl />
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Faculty Control Center</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setIsChangeRoomOpen(true)}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <DoorOpen className="h-4 w-4 mr-2 text-red-500" />
            Change Room
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/faculty/students")}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <Users className="h-4 w-4 mr-2 text-blue-400" />
            Enrolled Students
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsIssueModalOpen(true)}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
            Report Issue
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/faculty/availability")}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <Clock className="h-4 w-4 mr-2 text-emerald-400" />
            Availability
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <ChangeRoomModal
        isOpen={isChangeRoomOpen}
        onClose={() => setIsChangeRoomOpen(false)}
        onSuccess={(newRoomName) => setCurrentRoom(newRoomName)}
      />

      <IssueReportModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />

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
              <h3 className="text-xl font-semibold text-white">{selectedClass.schedule.course}</h3>
              <p className="text-sm text-gray-400">
                Section {selectedClass.schedule.section} • {selectedClass.schedule.type}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Faculty</p>
                <p className="text-sm font-medium text-white">Dr. Priya Sharma</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Day</p>
                <p className="text-sm font-medium text-white">{selectedClass.schedule.day}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-white">
                  {selectedClass.schedule.start} - {selectedClass.schedule.end}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Room / Lab</p>
                <p className="text-sm font-medium text-white">{selectedClass.schedule.room}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Enrolled Students ({selectedClass.students.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedClass.students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{s.full_name}</p>
                      <p className="text-xs text-gray-500">
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
    </div>
  );
}
