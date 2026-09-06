"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { formatIstDateTime } from "@/lib/utils";

interface EventDetail {
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

export default function StudentEventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await api.events.getById(params.id);
        setEvent(data as EventDetail);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMsg(err.message || "Failed to load event details.");
        } else {
          setErrorMsg("Something went wrong while loading event details.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [params.id]);

  const handleRegister = async () => {
    if (!event) return;
    setRegistering(true);
    setActionMsg("");
    setActionError("");
    try {
      await api.events.register(event.id);
      setEvent((prev) => prev ? { ...prev, is_registered: true, registrations: (prev.registrations || 0) + 1 } : prev);
      setActionMsg("You have successfully registered for this event.");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message || "Could not register for this event.");
      } else {
        setActionError("Registration failed. Please try again.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    setCancelling(true);
    setActionMsg("");
    setActionError("");
    try {
      await api.events.cancelRegistration(event.id);
      setEvent((prev) => prev ? { ...prev, is_registered: false, registrations: Math.max((prev.registrations || 1) - 1, 0) } : prev);
      setActionMsg("Registration cancelled successfully.");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message || "Could not cancel registration.");
      } else {
        setActionError("Cancellation failed. Please try again.");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton label="Back to Events" fallbackPath="/student/events" />
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading event details...
        </div>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton label="Back to Events" fallbackPath="/student/events" />
        <Card className="p-8 text-center text-sm text-red-400 border-white/10">
          {errorMsg || "Event not found."}
        </Card>
      </div>
    );
  }

  const isRegistered = !!event.is_registered;
  const isFull =
    event.capacity !== undefined &&
    event.registrations !== undefined &&
    event.registrations >= event.capacity &&
    !isRegistered;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackButton label="Back to Events" fallbackPath="/student/events" />

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{event.title}</h1>
        <p className="text-gray-400">Event Details</p>
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

      <Card className="p-6 border-white/10 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400">Organizer</p>
            <p className="text-sm text-white font-medium">{event.organizer || "Student Activity Center"}</p>
          </div>
          <Badge variant={isRegistered ? "default" : isFull ? "danger" : "info"}>
            {isRegistered ? "REGISTERED" : event.status || "upcoming"}
          </Badge>
        </div>

        {event.description && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-200">{event.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="h-4 w-4 text-red-400" />
            {formatIstDateTime(event.start_time)}
          </div>
          {event.end_time && (
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="h-4 w-4 text-red-400" />
              {formatIstDateTime(event.end_time)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-4 w-4 text-blue-400" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="h-4 w-4 text-emerald-400" />
            {event.registrations || 0} registered / {event.capacity || 100} capacity
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {isRegistered ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="border-white/10 text-xs text-gray-300 hover:text-white"
            >
              {cancelling ? "Cancelling..." : "Cancel Registration"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleRegister}
              disabled={registering || isFull}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl"
            >
              {registering ? "Registering..." : isFull ? "Event Full" : "Register"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
