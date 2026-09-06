"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, Sparkles, GraduationCap } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { formatIstDateTime } from "@/lib/utils";

interface FacultySlot {
  day: string;
  start: string;
  end: string;
  location: string;
}

interface FacultyDetails {
  id: string;
  faculty_id: string;
  faculty_name: string;
  full_name: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  office_location: string;
  is_available: boolean;
  status: string;
  next_available?: any;
  available_slots: FacultySlot[];
  schedule_today: any[];
}

export default function StudentFacultyDetailPage({ params }: { params: { id: string } }) {
  const [faculty, setFaculty] = useState<FacultyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadFaculty() {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await api.faculty.getById(params.id);
        setFaculty(data as FacultyDetails);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMsg(err.message || "Failed to load faculty details.");
        } else {
          setErrorMsg("Something went wrong while loading faculty details.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadFaculty();
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { variant: "success" as const, label: "Available Now" };
      case "IN CLASS":
        return { variant: "info" as const, label: "In Class" };
      case "OFFICE HOURS":
        return { variant: "warning" as const, label: "Office Hours" };
      case "UNAVAILABLE":
        return { variant: "danger" as const, label: "Unavailable" };
      default:
        return { variant: "default" as const, label: status };
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton label="Back to Faculty Directory" fallbackPath="/student/faculty" />
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading faculty details...
        </div>
      </div>
    );
  }

  if (errorMsg || !faculty) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton label="Back to Faculty Directory" fallbackPath="/student/faculty" />
        <Card className="p-8 text-center text-sm text-red-400 border-white/10">
          {errorMsg || "Faculty not found."}
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(faculty.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton label="Back to Faculty Directory" fallbackPath="/student/faculty" />

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Faculty Details</h1>
        <p className="text-gray-400">Academic profile, availability, and schedule</p>
      </div>

      <Card className="p-6 border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl uppercase">
              {faculty.full_name?.[0] || faculty.name?.[0] || "?"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{faculty.full_name || faculty.name}</h2>
              <p className="text-sm text-gray-400">
                {faculty.designation} | {faculty.department}
              </p>
              <p className="text-xs text-gray-400 mt-1">{faculty.email}</p>
            </div>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Office Location</div>
            <div className="text-white font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" /> {faculty.office_location}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Manual Availability</div>
            <div className="text-white font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> {faculty.is_available ? "Available" : "Unavailable"}
            </div>
          </div>
        </div>

        {faculty.next_available && (
          <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-blue-400 font-medium mb-1">Next Available</div>
            <p className="text-sm text-white">
              {faculty.next_available.ends_at || faculty.next_available.starts_at || "Check schedule"}
            </p>
          </div>
        )}
      </Card>

      {faculty.schedule_today && faculty.schedule_today.length > 0 && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-400" /> Today&apos;s Schedule
          </h3>
          <div className="space-y-3">
            {faculty.schedule_today.map((sess: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm text-white font-medium">{sess.course}</p>
                  <p className="text-xs text-gray-400">{sess.room} | {sess.type}</p>
                </div>
                <Badge variant="info">
                  {sess.start} - {sess.end}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {faculty.available_slots && faculty.available_slots.length > 0 && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" /> Office Hours
          </h3>
          <div className="space-y-2">
            {faculty.available_slots.map((slot, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm text-gray-300 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="font-medium">{slot.day}</span>
                <span>
                  {slot.start} - {slot.end} ({slot.location})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
