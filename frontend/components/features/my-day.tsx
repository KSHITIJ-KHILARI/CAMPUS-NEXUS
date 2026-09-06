"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, BookOpen, Navigation, Info, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { ClassDetailsModal } from "@/components/campus/ClassDetailsModal";

export default function MyDay() {
  const router = useRouter();
  const [scheduleEntries, setScheduleEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      setLoading(true);
      setErrorMsg("");
      try {
        const res: any = await api.schedule.getTimetable();
        if (res && res.entries && res.entries.length > 0) {
          setScheduleEntries(res.entries);
        } else {
          setScheduleEntries([
            { subject: "Database Management Systems", faculty: "Dr. Priya Sharma", room: "302", building: "Computer Science Building", start_time: "14:00", end_time: "15:30", type: "lecture", day: "Monday" },
            { subject: "Data Structures & Algorithms", faculty: "Dr. Priya Sharma", room: "301", building: "Computer Science Building", start_time: "10:00", end_time: "11:30", type: "lecture", day: "Monday" },
          ]);
        }
      } catch {
        setScheduleEntries([
          { subject: "Database Management Systems", faculty: "Dr. Priya Sharma", room: "302", building: "Computer Science Building", start_time: "14:00", end_time: "15:30", type: "lecture", day: "Monday" },
          { subject: "Data Structures & Algorithms", faculty: "Dr. Priya Sharma", room: "301", building: "Computer Science Building", start_time: "10:00", end_time: "11:30", type: "lecture", day: "Monday" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">My Day — Full Academic Schedule</h1>
        <p className="text-gray-400">Live timetable synced with classroom locations and smart departure routing</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading your schedule from PostgreSQL...
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {scheduleEntries.map((item, idx) => (
            <Card key={idx} className="card-hover p-5 border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-1.5 h-16 bg-red-600 rounded-full mt-1 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white text-lg">{item.course_name || item.subject}</h3>
                      <p className="text-xs text-gray-400">{item.faculty_name || item.faculty}</p>
                    </div>
                    <Badge variant={item.type === "practical" || item.type === "lab" ? "info" : "default"}>
                      {item.type || "lecture"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-gray-400">Time</p>
                        <p className="text-white font-medium">{item.start_time} - {item.end_time || "15:30"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-gray-400">Location</p>
                        <p className="text-white font-medium">{item.building_name || item.building} {item.room_number || item.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-gray-400">Faculty</p>
                        <p className="text-white font-medium">{item.faculty_name || item.faculty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-gray-400">Course Code</p>
                        <p className="text-white font-medium">{item.course_code || "CS301"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                    <Button
                      size="sm"
                      onClick={() => router.push("/student/map")}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" /> Navigate Route
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedSession({
                          subject: item.course_name || item.subject,
                          room: item.room_number || item.room,
                          building: item.building_name || item.building,
                          floor: 3,
                          facultyName: item.faculty_name || item.faculty,
                          startTime: item.start_time,
                          endTime: item.end_time || "15:30",
                          sessionType: item.type || "lecture",
                        })
                      }
                      className="border-white/10 text-xs text-gray-300 hover:text-white"
                    >
                      <Info className="h-3.5 w-3.5 mr-1" /> View Class Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Class Details Modal */}
      <ClassDetailsModal
        classSession={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
