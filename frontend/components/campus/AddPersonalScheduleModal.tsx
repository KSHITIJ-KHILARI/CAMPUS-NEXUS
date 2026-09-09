"use client";

import { useState } from "react";
import { Calendar, CheckCircle, AlertCircle, X, Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function AddPersonalScheduleModal({
  isOpen,
  onClose,
  onEventCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [day, setDay] = useState("Monday");
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
      await api.personalSchedule.add({
        title,
        location,
        startTime,
        endTime,
        day,
        type: "personal",
      });
      setStatusMsg(`Personal event '${title}' added to your timetable!`);
      if (onEventCreated) onEventCreated();
      setTimeout(() => {
        onClose();
        setTitle("");
        setLocation("");
        setStatusMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add personal event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Add Personal Event
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {statusMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. Study Group, Library Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. Library, Cafe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Add Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
