"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, BookOpen, Navigation, Info, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { AddPersonalScheduleModal } from "@/components/campus/AddPersonalScheduleModal";
import { ClassDetailsModal } from "@/components/campus/ClassDetailsModal";
import { useRef } from "react";

export default function MyDay() {
  const router = useRouter();
  const [scheduleEntries, setScheduleEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSchedule = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [officialRes, personalRes] = await Promise.all([
        api.schedule.getTimetable().catch(() => ({ entries: [] })),
        api.personalSchedule.getAll().catch(() => []),
      ]);
      
      let allEntries = [
        ...(officialRes?.entries || []),
        ...personalRes,
      ];

      // Sort by start time (assuming HH:mm format)
      allEntries.sort((a: any, b: any) => {
        const timeA = a.startTime || a.start_time || "00:00";
        const timeB = b.startTime || b.start_time || "00:00";
        return timeA.localeCompare(timeB);
      });

      if (allEntries.length > 0) {
        setScheduleEntries(allEntries);
      } else {
        setScheduleEntries([]);
      }
    } catch {
      setErrorMsg("Failed to load schedule.");
      setScheduleEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Button 
          onClick={() => setIsAddEventModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          + Add Personal Event
        </Button>
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
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading your schedule...
        </div>
      )}

      {!loading && (
        <div className="relative pt-4 pl-2 md:pl-4">
          {/* Vertical Timeline Line */}
          <div className="absolute top-0 bottom-0 left-20 md:left-28 w-px bg-white/10"></div>

          {scheduleEntries.map((item, idx) => {
            const isPersonal = item.type === "personal";
            const colorClass = isPersonal ? "bg-blue-600" : "bg-red-600";
            const borderClass = isPersonal ? "border-blue-500/30" : "border-red-500/30";

            return (
              <div key={idx} className="relative flex gap-4 md:gap-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                {/* Time Column */}
                <div className="w-14 md:w-20 text-right pt-2 flex-shrink-0">
                  <span className="text-sm font-bold text-white block">{item.startTime || item.start_time}</span>
                  <span className="text-xs text-gray-500 block">{item.endTime || item.end_time || "15:30"}</span>
                </div>

                {/* Timeline Marker */}
                <div className={`absolute left-20 md:left-28 w-3 h-3 rounded-full ${colorClass} transform -translate-x-1.5 mt-3 ring-4 ring-[#0a0a0a]`}></div>

                {/* Content Card */}
                <div className="flex-1 min-w-0">
                  <Card className={`schedule-card card-hover p-5 border-white/10 border-l-4 ${borderClass}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isPersonal ? (
                            <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none">Personal (Editable)</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none">College (Locked)</Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-lg">{item.title || item.course_name || item.subject}</h3>
                        <p className="text-xs text-gray-400">{item.faculty_name || item.faculty || "Self-Study"}</p>
                      </div>
                      <Badge variant={item.type === "practical" || item.type === "lab" ? "info" : "default"}>
                        {item.type || "lecture"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-400" />
                        <div>
                          <p className="text-gray-400">Location</p>
                          <p className="text-white font-medium">{item.location || `${item.building_name || item.building || "Campus"} ${item.room_number || item.room || ""}`}</p>
                        </div>
                      </div>
                      {!isPersonal && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-400" />
                          <div>
                            <p className="text-gray-400">Faculty</p>
                            <p className="text-white font-medium">{item.faculty_name || item.faculty}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                      <Button
                        size="sm"
                        onClick={() => router.push("/student/map")}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl"
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1" /> Route
                      </Button>
                      {!isPersonal && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedSession({
                              subject: item.title || item.course_name || item.subject,
                              room: item.location || item.room_number || item.room,
                              building: item.building_name || item.building || "",
                              floor: 3,
                              facultyName: item.faculty_name || item.faculty,
                              startTime: item.startTime || item.start_time,
                              endTime: item.endTime || item.end_time || "15:30",
                              sessionType: item.type || "lecture",
                            })
                          }
                          className="border-white/10 text-xs text-gray-300 hover:text-white"
                        >
                          <Info className="h-3.5 w-3.5 mr-1" /> Details
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Details Modal */}
      <ClassDetailsModal
        classSession={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      <AddPersonalScheduleModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onEventCreated={loadSchedule}
      />
    </div>
  );
}
