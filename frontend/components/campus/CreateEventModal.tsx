"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Gargi Plaza");
  const [capacity, setCapacity] = useState(150);
  const [eventDate, setEventDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [category, setCategory] = useState<"hackathon" | "cultural" | "academic" | "sports" | "workshop">("hackathon");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const startDateTimeIso = `${eventDate}T${startTime}:00`;
      const endDateTimeIso = `${eventDate}T${endTime}:00`;

      await api.admin.createEvent({
        title,
        description,
        location,
        capacity: Number(capacity),
        date: eventDate,
        start_time: startDateTimeIso,
        end_time: endDateTimeIso,
        category,
        status: "upcoming",
        organizer: "Somaiya Student Affairs / Admin",
      });
      setStatusMsg(`Event '${title}' successfully created with timing ${startTime}–${endTime} on ${eventDate}!`);
      if (onEventCreated) onEventCreated();
      setTimeout(() => {
        onClose();
        setTitle("");
        setDescription("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150 my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Campus Event</h3>
            <p className="text-xs text-gray-400">Publishes event with scheduled timings to student schedule & telemetry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Somaiya Hackathon 2026"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Location / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Gargi Plaza / Auditorium 101"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[#181828] border border-white/10 text-white focus:outline-none focus:border-red-500 text-xs"
              >
                <option value="hackathon">Hackathon & Innovation</option>
                <option value="cultural">Cultural Festival</option>
                <option value="academic">Academic / Keynote</option>
                <option value="sports">Sports Tournament</option>
                <option value="workshop">Interactive Workshop</option>
              </select>
            </div>
          </div>

          {/* Event Timing Section */}
          <div className="p-3.5 rounded-xl bg-[#161626] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Clock className="w-4 h-4 text-red-400" />
              <span>Event Date & Timing Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-400">Quick Duration:</span>
              {[
                { label: "1 Hour", s: "10:00", e: "11:00" },
                { label: "2 Hours", s: "10:00", e: "12:00" },
                { label: "Half Day (4h)", s: "09:00", e: "13:00" },
                { label: "Full Day", s: "09:00", e: "17:00" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setStartTime(preset.s);
                    setEndTime(preset.e);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Expected Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Event activities, guest speaker details, prerequisites..."
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5"
            >
              {loading ? "Publishing..." : "Publish Event with Timings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
