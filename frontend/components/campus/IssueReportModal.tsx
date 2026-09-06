"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, X, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api-client";

export function IssueReportModal({
  isOpen,
  onClose,
  onReported,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("projector");
  const [location, setLocation] = useState("CSB Room 301");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    try {
      await api.issues.create({
        title,
        category,
        location,
        description,
        priority,
      });
      setStatusMsg("Issue successfully submitted to Campus Operations & Maintenance!");
      if (onReported) onReported();
      setTimeout(() => {
        onClose();
        setTitle("");
        setDescription("");
      }, 1500);
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report Campus Issue</h3>
            <p className="text-xs text-gray-400">Notifies Campus Facilities with AI deduplication</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Issue Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Projector purple tint / AC not cooling"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
              >
                <option value="projector" className="bg-neutral-900">Projector / IT</option>
                <option value="ac" className="bg-neutral-900">Air Conditioning</option>
                <option value="lift" className="bg-neutral-900">Elevator / Lift</option>
                <option value="washroom" className="bg-neutral-900">Washroom</option>
                <option value="bench" className="bg-neutral-900">Furniture / Bench</option>
                <option value="electrical" className="bg-neutral-900">Electrical / Lights</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Urgency Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
              >
                <option value="low" className="bg-neutral-900">Low</option>
                <option value="medium" className="bg-neutral-900">Medium</option>
                <option value="high" className="bg-neutral-900">High</option>
                <option value="critical" className="bg-neutral-900">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CSB 301 / Aurobindo 2nd floor"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide context for facility team..."
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {statusMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Submitting..." : "Submit Incident Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
