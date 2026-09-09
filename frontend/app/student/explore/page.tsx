"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Sparkles, 
  Filter, 
  Wifi, 
  Monitor, 
  Zap, 
  Volume2, 
  VolumeX, 
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Bookmark,
  DoorOpen,
  Download,
  Check,
  GraduationCap,
  BookmarkCheck,
  FileText
} from "lucide-react";
import { 
  addCentralNotification,
  getStoredLibraryBooks,
  getStoredStudyGuides,
  reserveLibraryBook,
  reserveStudyGuide,
  type LibraryBook,
  type StudyGuide
} from "@/lib/relationalCampusData";
import { BookDetailsModal } from "@/components/campus/BookDetailsModal";

interface LibraryRoom {
  id: string;
  roomNumber: string;
  name: string;
  floor: number;
  floorLabel: string;
  capacity: number;
  type: "pod" | "suite" | "archive" | "solo";
  status: "available" | "occupied" | "reserved";
  currentBooking?: {
    reservedBy: string;
    until: string;
    purpose: string;
  };
  amenities: string[];
  noisePolicy: "Strict Silence" | "Whisper Only" | "Collaborative Discussion";
  imageFallbackColor: string;
}

const INITIAL_LIBRARY_ROOMS: LibraryRoom[] = [
  {
    id: "lib-101",
    roomNumber: "LIB-101",
    name: "Quiet Focus Pod Alpha",
    floor: 1,
    floorLabel: "1st Floor • North Wing",
    capacity: 2,
    type: "pod",
    status: "available",
    amenities: ["Acoustic Soundproofing", "Dual USB-C 65W Fast Charging", "Ergonomic Chairs", "Dimmable Task Light"],
    noisePolicy: "Whisper Only",
    imageFallbackColor: "from-emerald-950/40 to-black/60",
  },
  {
    id: "lib-102",
    roomNumber: "LIB-102",
    name: "Quiet Focus Pod Beta",
    floor: 1,
    floorLabel: "1st Floor • North Wing",
    capacity: 2,
    type: "pod",
    status: "occupied",
    currentBooking: {
      reservedBy: "Rohan Verma (SY B.Tech)",
      until: "04:30 PM",
      purpose: "Project Coding & Debugging"
    },
    amenities: ["Acoustic Soundproofing", "Power Outlets", "Desk Whiteboard", "Task Lamp"],
    noisePolicy: "Whisper Only",
    imageFallbackColor: "from-rose-950/40 to-black/60",
  },
  {
    id: "lib-201",
    roomNumber: "LIB-201",
    name: "Collaborative Research Suite 1",
    floor: 2,
    floorLabel: "2nd Floor • Innovation Wing",
    capacity: 6,
    type: "suite",
    status: "available",
    amenities: ["55\" 4K Screen (AirPlay/HDMI)", "Magnetic Glass Whiteboard", "Conference Mic", "Gigabit LAN"],
    noisePolicy: "Collaborative Discussion",
    imageFallbackColor: "from-blue-950/40 to-black/60",
  },
  {
    id: "lib-202",
    roomNumber: "LIB-202",
    name: "Collaborative Research Suite 2",
    floor: 2,
    floorLabel: "2nd Floor • Innovation Wing",
    capacity: 8,
    type: "suite",
    status: "occupied",
    currentBooking: {
      reservedBy: "Prof. Ananya Sen & AI Capstone Team",
      until: "05:00 PM",
      purpose: "Natural Language Processing Capstone Review"
    },
    amenities: ["65\" Interactive Touch Display", "Dual Full-Wall Whiteboards", "Air Conditioning", "Video Soundbar"],
    noisePolicy: "Collaborative Discussion",
    imageFallbackColor: "from-amber-950/40 to-black/60",
  },
  {
    id: "lib-203",
    roomNumber: "LIB-203",
    name: "Faculty & Scholar Reading Room",
    floor: 2,
    floorLabel: "2nd Floor • South Wing",
    capacity: 4,
    type: "suite",
    status: "available",
    amenities: ["Direct Stack Reference Access", "Dual Power Sockets", "Natural Daylighting", "Reading Loungers"],
    noisePolicy: "Whisper Only",
    imageFallbackColor: "from-purple-950/40 to-black/60",
  },
  {
    id: "lib-301",
    roomNumber: "LIB-301",
    name: "Digital Heritage & Archive Station",
    floor: 3,
    floorLabel: "3rd Floor • Special Collections",
    capacity: 4,
    type: "archive",
    status: "available",
    amenities: ["Overhead High-Res Book Scanner", "Microfilm Reader Workstation", "Archival Gloves Provided", "Dual 27\" Displays"],
    noisePolicy: "Strict Silence",
    imageFallbackColor: "from-cyan-950/40 to-black/60",
  },
  {
    id: "lib-302",
    roomNumber: "LIB-302",
    name: "Deep Silent Solo Cubicle A",
    floor: 3,
    floorLabel: "3rd Floor • Silence Zone",
    capacity: 1,
    type: "solo",
    status: "available",
    amenities: ["Strict Zero-Noise Policy", "Ergonomic Armchair", "Warm Lumbar Lamp", "Individual Climate Vent"],
    noisePolicy: "Strict Silence",
    imageFallbackColor: "from-emerald-950/40 to-black/60",
  },
  {
    id: "lib-303",
    roomNumber: "LIB-303",
    name: "Deep Silent Solo Cubicle B",
    floor: 3,
    floorLabel: "3rd Floor • Silence Zone",
    capacity: 1,
    type: "solo",
    status: "occupied",
    currentBooking: {
      reservedBy: "Aarav Sharma (Final Year)",
      until: "06:00 PM",
      purpose: "GATE Examination Prep"
    },
    amenities: ["Strict Zero-Noise Policy", "Warm Lumbar Lamp", "Power Outlet", "Individual Vent"],
    noisePolicy: "Strict Silence",
    imageFallbackColor: "from-rose-950/40 to-black/60",
  },
];

export default function LibraryRoomsPage() {
  // Navigation Section
  const [activeSection, setActiveSection] = useState<"rooms" | "books" | "guides">("rooms");

  // Rooms State
  const [rooms, setRooms] = useState<LibraryRoom[]>(INITIAL_LIBRARY_ROOMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "occupied">("all");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetRoom, setTargetRoom] = useState<LibraryRoom | null>(null);
  const [duration, setDuration] = useState("1 Hour");
  const [purpose, setPurpose] = useState("Research & Self Study");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");

  // Books State
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategory, setBookCategory] = useState<string>("all");
  const [selectedBookForModal, setSelectedBookForModal] = useState<LibraryBook | null>(null);

  // Study Guides State
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>([]);
  const [guideSearch, setGuideSearch] = useState("");
  const [guideDept, setGuideDept] = useState<string>("all");

  // Action toast
  const [actionToast, setActionToast] = useState<string | null>(null);

  useEffect(() => {
    setBooks(getStoredLibraryBooks());
    setStudyGuides(getStoredStudyGuides());

    const handleLibraryUpdate = () => {
      setBooks(getStoredLibraryBooks());
    };
    const handleGuidesUpdate = () => {
      setStudyGuides(getStoredStudyGuides());
    };

    window.addEventListener("nexus-library-updated", handleLibraryUpdate);
    window.addEventListener("nexus-guides-updated", handleGuidesUpdate);
    return () => {
      window.removeEventListener("nexus-library-updated", handleLibraryUpdate);
      window.removeEventListener("nexus-guides-updated", handleGuidesUpdate);
    };
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.amenities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFloor = floorFilter === "all" || r.floor === floorFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;

      return matchSearch && matchFloor && matchStatus;
    });
  }, [rooms, searchQuery, floorFilter, statusFilter]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = bookSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.subject && b.subject.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));

      const matchCat = bookCategory === "all" || b.category === bookCategory;
      return matchSearch && matchCat;
    });
  }, [books, bookSearch, bookCategory]);

  // Filtered study guides
  const filteredGuides = useMemo(() => {
    return studyGuides.filter((g) => {
      const q = guideSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.course_code.toLowerCase().includes(q) ||
        g.course_name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q);

      const matchDept = guideDept === "all" || g.department.toLowerCase().includes(guideDept.toLowerCase());
      return matchSearch && matchDept;
    });
  }, [studyGuides, guideSearch, guideDept]);

  // Statistics
  const totalCount = rooms.length;
  const availableCount = rooms.filter((r) => r.status === "available").length;
  const occupiedCount = totalCount - availableCount;

  const totalBooks = books.length;
  const totalAvailableCopies = books.reduce((acc, b) => acc + b.available_copies, 0);

  const handleOpenReserve = (room: LibraryRoom) => {
    setTargetRoom(room);
    setDuration("1 Hour");
    setPurpose("Research & Self Study");
    setBookingModalOpen(true);
  };

  const handleConfirmReservation = () => {
    if (!targetRoom) return;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === targetRoom.id
          ? {
              ...r,
              status: "occupied",
              currentBooking: {
                reservedBy: "You (Verified Student)",
                until: "Today, + " + duration,
                purpose: purpose,
              },
            }
          : r
      )
    );

    addCentralNotification({
      title: `Library Room Reserved: ${targetRoom.roomNumber}`,
      message: `You booked ${targetRoom.name} on Floor ${targetRoom.floor} for ${duration} (${purpose}). Check in at the library desk.`,
      type: "system",
      link: "/student/explore",
    });

    setBookingSuccessMsg(`Reserved ${targetRoom.roomNumber} successfully!`);
    setTimeout(() => {
      setBookingSuccessMsg("");
      setBookingModalOpen(false);
      setTargetRoom(null);
    }, 1500);
  };

  const handleReserveBookDirect = (bookId: string) => {
    try {
      const res = reserveLibraryBook(bookId);
      setBooks(getStoredLibraryBooks());
      setActionToast(res.message);
      setTimeout(() => setActionToast(null), 4500);
    } catch (err: any) {
      setActionToast(err.message || "Failed to reserve book.");
      setTimeout(() => setActionToast(null), 4000);
    }
  };

  const handleReserveGuideDirect = (guideId: string) => {
    try {
      const res = reserveStudyGuide(guideId);
      setStudyGuides(getStoredStudyGuides());
      setActionToast(res.message);
      setTimeout(() => setActionToast(null), 4500);
    } catch (err: any) {
      setActionToast(err.message || "Failed to reserve guide.");
      setTimeout(() => setActionToast(null), 4000);
    }
  };

  const handleDownloadGuide = (guide: StudyGuide) => {
    setActionToast(`Downloading "${guide.title}" (${guide.file_size})...`);
    addCentralNotification({
      title: `Downloaded: ${guide.course_code} Guide`,
      message: `Digital copy of "${guide.title}" accessed. Check your browser downloads.`,
      type: "material",
      link: "/student/explore",
      severity: "info",
    });
    setTimeout(() => setActionToast(null), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Action Toast */}
      {actionToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-sm shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{actionToast}</span>
          <button onClick={() => setActionToast(null)} className="ml-2 text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-neutral-900 via-neutral-950 to-[#A51C30]/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Somaiya Central Library (Granthagar)
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Library Knowledge & Study Commons
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl leading-relaxed">
              Reserve quiet study rooms, checkout academic textbooks from the circulation catalog, and access curated subject study guides across all engineering & science disciplines.
            </p>
          </div>

          {/* Quick Stats Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md text-center">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-0.5">Study Pods</div>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md text-center">
              <div className="text-2xl font-bold text-emerald-400">{availableCount}</div>
              <div className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-wider mt-0.5">Free Pods</div>
            </div>
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-md text-center">
              <div className="text-2xl font-bold text-indigo-400">{totalAvailableCopies}</div>
              <div className="text-[11px] font-medium text-indigo-400/80 uppercase tracking-wider mt-0.5">Books Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Level Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-900/80 border border-white/10 rounded-2xl backdrop-blur-xl">
        <button
          onClick={() => setActiveSection("rooms")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeSection === "rooms"
              ? "bg-[#A51C30] text-white shadow-lg shadow-red-950/50"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          Study Rooms & Pods ({rooms.length})
        </button>

        <button
          onClick={() => setActiveSection("books")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeSection === "books"
              ? "bg-[#A51C30] text-white shadow-lg shadow-red-950/50"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Textbooks & Book Catalog ({books.length})
        </button>

        <button
          onClick={() => setActiveSection("guides")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeSection === "guides"
              ? "bg-[#A51C30] text-white shadow-lg shadow-red-950/50"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Study Guides & Learning Hub ({studyGuides.length})
        </button>
      </div>

      {/* SECTION 1: STUDY ROOMS & PODS */}
      {activeSection === "rooms" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by pod name, number, or amenity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Floor filter */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
                <span className="text-neutral-500 px-2 flex items-center gap-1 font-medium">
                  <Layers className="w-3.5 h-3.5" /> Floor:
                </span>
                <button
                  onClick={() => setFloorFilter("all")}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    floorFilter === "all" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFloorFilter(1)}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    floorFilter === 1 ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  1st Fl
                </button>
                <button
                  onClick={() => setFloorFilter(2)}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    floorFilter === 2 ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  2nd Fl
                </button>
                <button
                  onClick={() => setFloorFilter(3)}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    floorFilter === 3 ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  3rd Fl
                </button>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
                <span className="text-neutral-500 px-2 flex items-center gap-1 font-medium">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    statusFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("available")}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    statusFilter === "available" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setStatusFilter("occupied")}
                  className={`px-2.5 py-1 rounded transition-all font-medium ${
                    statusFilter === "occupied" ? "bg-rose-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Occupied
                </button>
              </div>
            </div>
          </div>

          {/* Library Room Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const isAvailable = room.status === "available";

              return (
                <Card
                  key={room.id}
                  className="group relative overflow-hidden bg-neutral-900/60 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl flex flex-col justify-between backdrop-blur-md shadow-lg hover:shadow-xl"
                >
                  {/* Header Visual Bar */}
                  <div className={`h-28 bg-gradient-to-br ${room.imageFallbackColor} border-b border-white/10 p-4 flex flex-col justify-between relative`}>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-mono font-bold px-2.5 py-0.5">
                        {room.roomNumber}
                      </Badge>

                      <Badge
                        className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-0.5 border ${
                          isAvailable
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {isAvailable ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Available Now
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Occupied
                          </>
                        )}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {room.floorLabel}
                      </div>
                    </div>
                  </div>

                  {/* Room Details & Amenities */}
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Meta Specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Capacity: <strong className="text-white">{room.capacity} {room.capacity === 1 ? "Person" : "Persons"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          {room.noisePolicy === "Strict Silence" ? (
                            <VolumeX className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{room.noisePolicy}</span>
                        </div>
                      </div>

                      {/* Occupant Notice (if occupied) */}
                      {!isAvailable && room.currentBooking && (
                        <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 text-xs text-rose-300 space-y-1">
                          <div className="font-semibold flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Booked until {room.currentBooking.until}
                          </div>
                          <div className="text-neutral-400 text-[11px] truncate">
                            Purpose: {room.currentBooking.purpose}
                          </div>
                        </div>
                      )}

                      {/* Amenities Tags */}
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
                          Included Facilities
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-1"
                            >
                              <Zap className="w-2.5 h-2.5 text-yellow-400/80" />
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <div className="pt-3 border-t border-white/5">
                      {isAvailable ? (
                        <Button
                          onClick={() => handleOpenReserve(room)}
                          className="w-full bg-[#A51C30] hover:bg-[#851626] text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-md shadow-red-950/50 flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Instant Reserve Room
                        </Button>
                      ) : (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full border-white/10 bg-white/5 text-neutral-500 text-xs py-2 rounded-xl cursor-not-allowed"
                        >
                          Occupied (Opens at {room.currentBooking?.until || "later"})
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: TEXTBOOKS & BOOK CATALOG */}
      {activeSection === "books" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Book Search & Category Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by title, author, subject, or ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {["all", "Computer Science", "Information Technology", "Artificial Intelligence", "Mathematics"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBookCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    bookCategory === cat
                      ? "bg-[#A51C30] text-white shadow-md shadow-red-950/40"
                      : "bg-black/40 text-neutral-400 hover:text-white border border-white/5"
                  }`}
                >
                  {cat === "all" ? "All Subjects" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBooks.map((b) => {
              const isAvailable = b.available_copies > 0;

              return (
                <Card
                  key={b.id}
                  className="group relative overflow-hidden bg-neutral-900/60 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl flex flex-col justify-between backdrop-blur-md shadow-lg hover:shadow-xl"
                >
                  {/* Book Cover Header */}
                  <div className={`h-36 bg-gradient-to-br ${b.cover_gradient || "from-red-950 to-neutral-950"} border-b border-white/10 p-4 flex flex-col justify-between relative`}>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-black/60 backdrop-blur-md border border-white/15 text-white text-[10px] font-mono">
                        {b.category}
                      </Badge>

                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 border ${
                          isAvailable
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {isAvailable ? `${b.available_copies} Available` : "Checked Out"}
                      </Badge>
                    </div>

                    <div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/10 w-fit mb-1.5">
                        <BookOpen className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-[11px] text-neutral-300 font-medium line-clamp-1">{b.edition || "Academic Edition"}</span>
                    </div>
                  </div>

                  {/* Book Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                        {b.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">by {b.author}</p>

                      <div className="mt-3 space-y-1.5 text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Shelf:</span>
                          <span className="text-white font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            {b.shelf_location || "LLC Floor 2"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Holding:</span>
                          <span className="text-emerald-400 font-semibold">{b.available_copies} of {b.total_copies} Copies</span>
                        </div>
                      </div>
                    </div>

                    {/* Book Action Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedBookForModal(b)}
                        className="flex-1 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl h-8"
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isAvailable}
                        onClick={() => handleReserveBookDirect(b.id)}
                        className={`flex-1 text-xs font-semibold rounded-xl h-8 ${
                          isAvailable
                            ? "bg-[#A51C30] hover:bg-[#851626] text-white shadow-md shadow-red-950/40"
                            : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                        }`}
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1" />
                        {isAvailable ? "Reserve" : "Waitlist"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: STUDY GUIDES & LEARNING HUB */}
      {activeSection === "guides" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Guide Search & Department Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search study guides, GATE modules, cheatsheets..."
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {["all", "Computer Engineering", "Information Technology", "Basic and Applied Sciences"].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setGuideDept(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    guideDept === dept
                      ? "bg-[#A51C30] text-white shadow-md shadow-red-950/40"
                      : "bg-black/40 text-neutral-400 hover:text-white border border-white/5"
                  }`}
                >
                  {dept === "all" ? "All Departments" : dept.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Study Guides List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map((g) => (
              <Card
                key={g.id}
                className="p-5 bg-neutral-900/60 border border-white/10 hover:border-white/20 transition-all rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                        {g.course_code}
                      </Badge>
                      <span className="text-xs text-neutral-400">Sem {g.semester} • {g.department}</span>
                    </div>
                    <Badge className="bg-white/10 text-neutral-300 text-[10px] uppercase font-bold tracking-wider">
                      {g.file_type} • {g.file_size}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{g.title}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{g.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-neutral-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      Physical Print: <strong className="text-emerald-400">{g.physical_copies_available} copies</strong> at {g.shelf_location}
                    </span>
                    <span className="text-neutral-500">{g.downloads_count} students accessed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownloadGuide(g)}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl h-9 flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReserveGuideDirect(g.id)}
                      className="flex-1 bg-[#A51C30] hover:bg-[#851626] text-white text-xs font-semibold rounded-xl h-9 flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Reserve Physical Copy
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBookForModal && (
        <BookDetailsModal
          book={selectedBookForModal as any}
          isOpen={!!selectedBookForModal}
          onClose={() => setSelectedBookForModal(null)}
          onReserved={() => {
            setBooks(getStoredLibraryBooks());
            setSelectedBookForModal(null);
            setActionToast("Book reserved successfully! Collect at Library Circulation Desk.");
            setTimeout(() => setActionToast(null), 4000);
          }}
        />
      )}

      {/* Reservation Dialog Modal for Rooms */}
      {bookingModalOpen && targetRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-neutral-950 border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reserve Study Room</h3>
                  <p className="text-xs text-neutral-400">{targetRoom.name} • {targetRoom.roomNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">{bookingSuccessMsg}</h4>
                <p className="text-xs text-neutral-400">Please arrive at Central Library Floor {targetRoom.floor} on time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Selected Space</label>
                  <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{targetRoom.name}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Floor {targetRoom.floor}</Badge>
                    </div>
                    <div className="text-neutral-400">Max Capacity: {targetRoom.capacity} {targetRoom.capacity === 1 ? "student" : "students"} • Policy: {targetRoom.noisePolicy}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Reservation Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="30 Minutes">30 Minutes (Quick Discussion)</option>
                    <option value="1 Hour">1 Hour (Standard Slot)</option>
                    <option value="2 Hours">2 Hours (Deep Focus Block)</option>
                    <option value="3 Hours">3 Hours (Group Project)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Study Purpose / Subject</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Distributed Systems exam prep"
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="text-[11px] text-neutral-400 flex items-start gap-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>Rooms automatically release if check-in QR code is not scanned within 15 minutes of scheduled start.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBookingModalOpen(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmReservation}
                    className="bg-[#A51C30] hover:bg-[#851626] text-white text-xs font-semibold px-5 rounded-xl shadow-lg shadow-red-950/50"
                  >
                    Confirm & Reserve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
