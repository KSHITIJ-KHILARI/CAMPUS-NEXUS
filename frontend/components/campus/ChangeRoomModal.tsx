"use client";

import { useState } from "react";
import { DoorOpen, ArrowRight, Bell, CheckCircle, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api-client";

export function ChangeRoomModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newRoom: string) => void;
}) {
  const [newRoom, setNewRoom] = useState("402");
  const [building, setBuilding] = useState("Aurobindo");
  const [reason, setReason] = useState("Equipped lab required for practical demo");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await api.schedule.reassignRoom({
        new_room_number: newRoom,
        new_building_name: building,
      });
      setStatusMsg(`Successfully reassigned room to ${building} ${newRoom}! Enrolled students notified.`);
      if (onSuccess) onSuccess(`${building} ${newRoom}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to update room. Please try again.");
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
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Reassign Classroom</h3>
            <p className="text-xs text-gray-400">Updates live schedule & dispatches student alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Building</label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
            >
              <option value="Computer Science Building" className="bg-neutral-900">Computer Science Building (CSB)</option>
              <option value="Aurobindo" className="bg-neutral-900">Aurobindo Building</option>
              <option value="Main Academic Block" className="bg-neutral-900">Main Academic Block (MAB)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">New Room Number</label>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="e.g. 402 or Lab 3"
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Reason for Reassignment</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
              {loading ? "Reassigning..." : "Reassign & Notify Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
