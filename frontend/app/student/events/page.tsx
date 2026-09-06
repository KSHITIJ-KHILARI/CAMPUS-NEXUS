"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { api, apiClient, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { formatIstDateTime } from "@/lib/utils";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  organizer?: string;
  start_time: string;
  end_time?: string;
  capacity?: number;
  registrations?: number;
  status?: string;
  is_registered?: boolean;
}

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.events.getAll();
      const list = Array.isArray(data)
        ? data
        : (data as any).items
          ? (data as any).items
          : (data as any).data
            ? (data as any).data
            : [];
      const mapped = (list as any[]).map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        organizer: e.organizer,
        start_time: e.start_time || e.startDate,
        end_time: e.end_time || e.endDate,
        capacity: e.capacity,
        registrations: e.registrations,
        status: e.status || "upcoming",
        is_registered: !!e.is_registered,
      }));
      setEvents(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Unable to load events.");
      } else {
        setErrorMsg("Something went wrong while loading events.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (id: string) => {
    setActionMsg("");
    setActionError("");
    try {
      await api.events.register(id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, is_registered: true, registrations: (e.registrations || 0) + 1 }
            : e
        )
      );
      setActionMsg("You have successfully registered for this event.");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message || "Could not register for this event.");
      } else {
        setActionError("Registration failed. Please try again.");
      }
    }
  };

  const handleCancel = async (id: string) => {
    setActionMsg("");
    setActionError("");
    try {
      await apiClient.delete(`/events/${id}/registration`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, is_registered: false, registrations: Math.max((e.registrations || 1) - 1, 0) }
            : e
        )
      );
      setActionMsg("Registration cancelled.");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message || "Could not cancel registration.");
      } else {
        setActionError("Cancellation failed. Please try again.");
      }
    }
  };

  const upcoming = events.filter((e) => e.status === "upcoming" || !e.status);
  const past = events.filter((e) => e.status === "completed" || e.status === "cancelled");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Events</h1>
        <p className="text-gray-400">Upcoming events and your registrations</p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {actionError}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading events...
        </div>
      )}

      {!loading && upcoming.length === 0 && !errorMsg && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No upcoming events found.</Card>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
          {upcoming.map((evt) => {
            const isRegistered = !!evt.is_registered;
            const isFull =
              evt.capacity !== undefined &&
              evt.registrations !== undefined &&
              evt.registrations >= evt.capacity &&
              !isRegistered;
            return (
              <Card
                key={evt.id}
                className="card-hover p-5 border-white/10 flex flex-col space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">{evt.title}</h3>
                    <p className="text-xs text-gray-400">{evt.organizer || "Student Activity Center"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isRegistered ? "default" : isFull ? "danger" : "info"}>
                      {isRegistered ? "REGISTERED" : evt.status || "upcoming"}
                    </Badge>
                  </div>
                </div>

                {evt.description && (
                  <p className="text-xs text-gray-300 line-clamp-2">{evt.description}</p>
                )}

                <div className="space-y-1 text-xs text-gray-400 pt-1 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-red-400" />
                    {formatIstDateTime(evt.start_time)}
                  </div>
                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      {evt.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    {evt.registrations || 0} registered / {evt.capacity || 100} capacity
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {isRegistered ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(evt.id)}
                      className="border-white/10 text-xs text-gray-300 hover:text-white"
                    >
                      Cancel Registration
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isFull}
                      onClick={() => handleRegister(evt.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl"
                    >
                      {isFull ? "Full" : "Register"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (window.location.href = `/student/events/${evt.id}`)}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Past Events</h2>
          {past.map((evt) => (
            <Card key={evt.id} className="p-4 border-white/5 flex flex-col space-y-2 opacity-70">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">{evt.title}</h3>
                  <p className="text-xs text-gray-400">{evt.organizer}</p>
                </div>
                <Badge variant="default" className="text-[10px]">
                  {evt.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {formatIstDateTime(evt.start_time)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
