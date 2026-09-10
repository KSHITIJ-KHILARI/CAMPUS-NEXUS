"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type RoomVacancyInfo,
  type CampusRoom,
  getVacantRoomsStatus,
  getStoredRooms,
  addCentralNotification,
} from "@/lib/relationalCampusData";
import { api } from "@/lib/api-client";
import {
  Building2,
  DoorOpen,
  DoorClosed,
  Clock,
  Users,
  Search,
  Filter,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function VacantRoomsView() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [selectedTime, setSelectedTime] = useState<string>("10:30");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "vacant_only" | "cancelled_only">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomsData, setRoomsData] = useState<RoomVacancyInfo[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const refreshRooms = async () => {
    const baseData = getVacantRoomsStatus(selectedDay, selectedTime);
    try {
      const reservations = await api.rooms.getActiveReservations();
      const mergedData = baseData.map(roomData => {
        const activeRes = (reservations as any[]).find(r => r.room_number === roomData.room.room_number);
        if (activeRes) {
          return {
            ...roomData,
            is_vacant: false,
            status: "OCCUPIED" as const,
            status_label: activeRes.status === "approved" ? "Occupied (Reserved)" : "Reservation Pending",
          };
        }
        return roomData;
      });
      setRoomsData(mergedData);
    } catch (e) {
      setRoomsData(baseData);
    }
  };

  useEffect(() => {
    refreshRooms();
    const handleTimetableUpdate = () => {
      refreshRooms();
    };
    window.addEventListener("nexus-timetable-updated", handleTimetableUpdate);
    return () => window.removeEventListener("nexus-timetable-updated", handleTimetableUpdate);
  }, [selectedDay, selectedTime]);

  const filteredRooms = useMemo(() => {
    return roomsData.filter((item) => {
      const { room } = item;
      if (selectedBuilding !== "all" && room.building_id !== selectedBuilding) return false;
      if (selectedType !== "all" && room.type !== selectedType) return false;

      if (statusFilter === "vacant_only" && !item.is_vacant) return false;
      if (statusFilter === "cancelled_only" && item.status !== "FREED_BY_CANCELLATION") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(q);
        const matchNum = room.room_number.toLowerCase().includes(q);
        const matchBuilding = room.building_name.toLowerCase().includes(q);
        const matchFacilities = room.facilities.some(f => f.toLowerCase().includes(q));
        if (!matchName && !matchNum && !matchBuilding && !matchFacilities) return false;
      }

      return true;
    });
  }, [roomsData, selectedBuilding, selectedType, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = roomsData.length;
    const vacant = roomsData.filter(r => r.is_vacant).length;
    const cancelledFreed = roomsData.filter(r => r.status === "FREED_BY_CANCELLATION").length;
    const occupied = total - vacant;
    return { total, vacant, cancelledFreed, occupied };
  }, [roomsData]);

  const handleQuickReserve = async (roomNumber: string) => {
    try {
      await api.rooms.createReservation({ room_number: roomNumber });
      setBookingSuccess(`Room ${roomNumber} reservation requested! Pending Admin approval.`);
      addCentralNotification({
        title: `Room Reservation Requested: ${roomNumber}`,
        message: `You have requested to reserve room ${roomNumber}. Please wait for admin approval.`,
        type: "system",
        link: "/student/rooms",
        severity: "info",
      });
      setTimeout(() => setBookingSuccess(null), 4000);
      refreshRooms();
    } catch (e: any) {
      console.error(e);
      setBookingSuccess(`Failed to reserve room ${roomNumber}: ${e.message}`);
      setTimeout(() => setBookingSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {bookingSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{bookingSuccess}</span>
          </div>
          <button onClick={() => setBookingSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Header Card */}
      <Card className="p-6 md:p-8 bg-[#12121e]/90 border-white/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <DoorOpen className="w-5 h-5" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Live Vacant Rooms & Study Spaces
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Real-time room occupancy synced with the academic timetable, lecture cancellations, and 3D campus twin. Instantly find quiet study halls, empty labs, or collaborative library pods.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/student/campus-hub">
              <Button className="bg-[#A51C30] hover:bg-[#851626] text-white text-xs h-10 px-4 rounded-xl">
                <MapPin className="w-4 h-4 mr-2" />
                View on 3D Digital Twin
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-gray-400">Monitored Rooms</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium">Currently Vacant</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.vacant}</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium">Freed by Cancellations</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.cancelledFreed}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">Occupied in Class</p>
            <p className="text-xl font-bold text-red-400 mt-0.5">{stats.occupied}</p>
          </div>
        </div>
      </Card>

      {/* Control Bar: Time / Day simulation & Filters */}
      <Card className="p-4 md:p-5 bg-[#12121e]/80 border-white/10 space-y-4">
        {/* Time Simulator */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#181828] rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A51C30]" />
            <span className="text-xs font-semibold text-white">Live Query Time Machine:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-[#12121e] text-xs text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Time:</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-[#12121e] text-xs text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none"
              >
                {[
                  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                  "15:00", "15:30", "16:00", "16:30", "17:00"
                ].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={refreshRooms}
              className="text-xs h-7 border-white/10 text-gray-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Check Now
            </Button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search room name, lab, or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#181828] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
            />
          </div>

          {/* Building Filter */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="bg-[#181828] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Buildings</option>
            <option value="ssbas">KJSCE (SSBAS) Engineering</option>
            <option value="bhaskaracharya">Bhaskaracharya Complex</option>
            <option value="aurobindo">Sri Aurobindo Building</option>
            <option value="library">Somaiya Central Library</option>
          </select>

          {/* Room Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#181828] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Room Types</option>
            <option value="classroom">Lecture Classrooms</option>
            <option value="laboratory">High-Tech Laboratories</option>
            <option value="study_pod">Library Quiet Pods</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#181828] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Statuses (Vacant & In Class)</option>
            <option value="vacant_only">Vacant Only</option>
            <option value="cancelled_only">Freed by Cancellations Only</option>
          </select>
        </div>
      </Card>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((item) => {
          const { room, is_vacant, status, status_label, current_slot, cancellation_notice } = item;

          return (
            <Card
              key={room.id}
              className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                status === "FREED_BY_CANCELLATION"
                  ? "bg-[#181628] border-amber-500/40 shadow-lg shadow-amber-500/5"
                  : is_vacant
                  ? "bg-[#121622] border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-[#16121e] border-red-500/20 opacity-85"
              }`}
            >
              {/* Top Row: Room Number & Status Badge */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-400 block mb-0.5">
                      {room.building_name} • Floor {room.floor}
                    </span>
                    <h3 className="text-lg font-bold text-white">{room.room_number}</h3>
                    <p className="text-xs text-gray-300 font-medium">{room.name}</p>
                  </div>

                  {status === "FREED_BY_CANCELLATION" ? (
                    <Badge variant="warning" className="animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Freed by Cancellation
                    </Badge>
                  ) : is_vacant ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <DoorOpen className="w-3 h-3" /> Vacant
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="flex items-center gap-1">
                      <DoorClosed className="w-3 h-3" /> In Class
                    </Badge>
                  )}
                </div>

                {/* Status Explanation */}
                <div className={`p-3 rounded-xl text-xs space-y-1 ${
                  status === "FREED_BY_CANCELLATION"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-200"
                    : is_vacant
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {status_label}
                  </p>
                  {cancellation_notice && (
                    <p className="text-[11px] text-amber-300/80 italic">
                      Notice: {cancellation_notice}
                    </p>
                  )}
                  {current_slot && !current_slot.is_cancelled && (
                    <p className="text-[11px] text-gray-300">
                      {current_slot.start_time}–{current_slot.end_time} • {current_slot.course_name}
                    </p>
                  )}
                </div>

                {/* Facility Tags */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1.5">Facilities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Capacity: <strong className="text-white">{room.capacity}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link href={`/student/campus-hub?building=${room.building_id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-white/10 text-gray-300 hover:text-white"
                      title="View 3D map building"
                    >
                      <MapPin className="w-3 h-3 mr-1" /> 3D Map
                    </Button>
                  </Link>

                  {is_vacant && (
                    <Button
                      size="sm"
                      onClick={() => handleQuickReserve(room.room_number)}
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Reserve 1h
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <Card className="p-12 text-center bg-[#12121e]/60 border-white/10 space-y-2">
          <DoorClosed className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No rooms matched your query</h3>
          <p className="text-xs text-gray-400">Try changing the building, room type, or target time filter.</p>
        </Card>
      )}
    </div>
  );
}
