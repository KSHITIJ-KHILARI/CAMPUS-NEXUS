"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DoorOpen,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api-client";

type RoomReservation = {
  id: string;
  room_number: string;
  student_id: string;
  reserved_at: string;
  status: string;
};

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "rejected",
  "completed",
];

export default function AdminRoomsPage() {
  const [reservations, setReservations] = useState<RoomReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await api.rooms.getReservations();
      setReservations((data as RoomReservation[]) || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    setUpdatingId(reservationId);
    try {
      await api.rooms.updateReservation(reservationId, { status: newStatus });
      await fetchReservations();
    } catch {
      //
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = reservations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.room_number && r.room_number.toLowerCase().includes(q)) ||
      (r.student_id && r.student_id.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q)
    );
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Room Reservations</h1>
          <p className="text-gray-400">Monitor and manage all room booking requests</p>
        </div>
        <Button
          onClick={fetchReservations}
          variant="outline"
          className="border-white/10 text-gray-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by room number, student ID, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-emerald-500" /> Loading reservations...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No reservations found.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 border-white/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-white text-sm">Room {r.room_number}</span>
                    <Badge variant={statusVariant(r.status) as any}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Student: {r.student_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    Reserved: {new Date(r.reserved_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusUpdate(r.id, e.target.value)}
                    disabled={updatingId === r.id}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-neutral-900">
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(r.id, "approved")}
                    disabled={updatingId === r.id}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(r.id, "rejected")}
                    disabled={updatingId === r.id}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
