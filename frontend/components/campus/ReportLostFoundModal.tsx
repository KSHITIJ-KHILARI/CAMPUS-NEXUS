"use client";

import { useState } from "react";
import { Search, CheckCircle, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api-client";

export function ReportLostFoundModal({
  isOpen,
  onClose,
  onReportCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("lost");
  const [category, setCategory] = useState("personal_belongings");
  const [location, setLocation] = useState("Main Library");
  const [description, setDescription] = useState("");
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
      await api.lostFound.reportItem({
        title,
        type,
        category,
        location,
        description,
      });
      setStatusMsg(`Report for '${title}' successfully filed!`);
      if (onReportCreated) onReportCreated();
      setTimeout(() => {
        onClose();
        setTitle("");
        setDescription("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit report");
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
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report Lost or Found Item</h3>
            <p className="text-xs text-gray-400">Stores report in campus database & matches automatically</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Report Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
              >
                <option value="lost" className="bg-neutral-900">I Lost An Item</option>
                <option value="found" className="bg-neutral-900">I Found An Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
              >
                <option value="electronics" className="bg-neutral-900">Electronics / Phone</option>
                <option value="documents" className="bg-neutral-900">ID / Wallet / Keys</option>
                <option value="bags" className="bg-neutral-900">Backpack / Bag</option>
                <option value="personal_belongings" className="bg-neutral-900">Personal Belongings</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Item Title / Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black leather wallet / Blue water bottle"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Location (Last Seen or Found)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Library Floor 2 / Canteen"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Item Description & Identifiers</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Color, brand, key marks..."
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
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
              className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Filing Report..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
