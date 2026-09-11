"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Plus, Trash2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { api, apiClient, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { CreateEventModal } from "@/components/campus/CreateEventModal";
import { formatIstDateTime } from "@/lib/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.admin.getEvents();
      setEvents(Array.isArray(data) ? data : (data as any).items || []);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setDeleteError("");
    try {
      await api.admin.deleteEvent(id);
      setSuccessMsg("Event deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchEvents();
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message || "Could not delete event.");
      } else {
        setDeleteError("Failed to delete event. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Event
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Events Management</h1>
        <p className="text-gray-400">Organize, publish, and track campus event registrations and crowd telemetry</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {deleteError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {deleteError}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading events from Firestore...
        </div>
      )}

      {!loading && errorMsg && (
        <Card className="p-6 text-center text-sm text-red-400 border-red-500/20">
          {errorMsg}
        </Card>
      )}

      {!loading && !errorMsg && events.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No active events found.</Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading &&
          events.map((evt) => (
            <Card key={evt.id} className="card-hover p-5 border-white/10 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">{evt.title}</h3>
                    <p className="text-xs text-gray-400">Organizer: {evt.organizer || "Student Activity Center"}</p>
                  </div>
                  <Badge variant="info">{evt.status || "upcoming"}</Badge>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 mt-1">{evt.description}</p>
              </div>

              <div className="space-y-2 text-xs text-gray-400 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-red-400" />
                  <span>
                    {formatIstDateTime(evt.start_time)}
                    {evt.end_time && ` – ${formatIstDateTime(evt.end_time)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  {evt.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  {evt.registrations || 0} registered / {evt.capacity || 100} capacity
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(evt.id)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
      </div>

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onEventCreated={fetchEvents}
      />
    </div>
  );
}
