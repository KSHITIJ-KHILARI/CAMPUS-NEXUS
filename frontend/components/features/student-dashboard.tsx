"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { StaggerContainer, FadeUp } from "@/components/ui/motion-wrapper";
import {
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Navigation,
  Activity,
  UtensilsCrossed,
  BookOpen,
  Coffee,
  Users,
  Search,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { IssueReportModal } from "@/components/campus/IssueReportModal";
import { GlobalCommandPalette } from "@/components/campus/GlobalCommandPalette";
import { BookDetailsModal } from "@/components/campus/BookDetailsModal";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export default function StudentDashboard() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [leaveNow, setLeaveNow] = useState(false);
  const [nextClassData, setNextClassData] = useState<any>({
    subject: "Database Management Systems",
    room: "CSB 302",
    building: "Computer Science Building",
    startTime: "2:00 PM",
    startsIn: 20,
    travelTime: 14,
    recommendedLeave: "1:42 PM",
    status: "warning",
    statusMessage: "Aurobindo Lift 2 unavailable due to maintenance",
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const [rushTelemetry, setRushTelemetry] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [nc, rush] = await Promise.all([
          api.schedule.getNextClass().catch(() => null),
          api.location.getRush().catch(() => []),
        ]);
        if (nc && (nc as any).course_name) {
          setNextClassData({
            subject: (nc as any).course_name,
            room: (nc as any).room || "CSB 302",
            building: (nc as any).building || "Computer Science Building",
            startTime: (nc as any).start_time || "2:00 PM",
            startsIn: (nc as any).starts_in_minutes || 20,
            travelTime: 14,
            recommendedLeave: "1:42 PM",
            status: "warning",
            statusMessage: "CSB Lift 2 under maintenance (Use stairs or Lift 1)",
          });
        }
        if (rush && Array.isArray(rush)) {
          setRushTelemetry(rush);
        }
      } catch {
        // Fall back to demo data; no user-facing error needed on dashboard
      }
    }
    loadData();
  }, []);

  // GSAP header entrance animation
  useGSAP(() => {
    if (prefersReduced || !headerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      headerRef.current.querySelector("h1"),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    .fromTo(
      headerRef.current.querySelector("p"),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.25"
    )
    .fromTo(
      headerRef.current.querySelector("button"),
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3 },
      "-=0.2"
    );
  }, { scope: headerRef, dependencies: [prefersReduced] });

  const openBookDemo = async () => {
    try {
      const books = await api.library.getBooks();
      if (books && books.length > 0) {
        setSelectedBook(books[0]);
      } else {
        router.push("/student/explore");
      }
    } catch {
      router.push("/student/explore");
    }
  };

  // Build comprehensive BentoGrid items
  const canteen = rushTelemetry.find((r: any) =>
    r.location_name?.toLowerCase().includes("canteen") || r.location_id === 5
  );
  const library = rushTelemetry.find((r: any) =>
    r.location_name?.toLowerCase().includes("library") || r.location_id === 4
  );
  const foodSpot = rushTelemetry.find((r: any) =>
    r.location_name?.toLowerCase().includes("maggi") ||
    r.location_name?.toLowerCase().includes("nescafe") ||
    r.location_id === 9
  );

  const getRushStatus = (level: string) => {
    const l = (level || "LOW").toUpperCase();
    if (l === "HIGH" || l === "VERY_HIGH") return "High Density";
    if (l === "MODERATE") return "Moderate Rush";
    return "Available";
  };

  const dashboardBentoItems: BentoItem[] = [
    // 1. Next Class — Hero Bento Item (colSpan: 2)
    {
      title: nextClassData.subject,
      meta: nextClassData.startTime,
      description: `Assigned: ${nextClassData.room} (${nextClassData.building})`,
      icon: <Calendar className="w-4 h-4 text-red-500" />,
      status: nextClassData.status === "warning" ? "Lift Notice" : `Starts in ${nextClassData.startsIn}m`,
      tags: ["Academic", "Navigation", `ETA ${nextClassData.travelTime}m`],
      colSpan: 2,
      hasPersistentHover: true,
      cta: "Live Smart Route Active →",
      children: (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 truncate">Room</p>
                <p className="text-xs font-semibold text-white truncate">{nextClassData.room}</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 truncate">Scheduled</p>
                <p className="text-xs font-semibold text-white truncate">{nextClassData.startTime}</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 truncate">Starts In</p>
                <p className="text-xs font-semibold text-white truncate">{nextClassData.startsIn} min</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 truncate">Travel ETA</p>
                <p className="text-xs font-semibold text-white truncate">{nextClassData.travelTime} min</p>
              </div>
            </div>
          </div>

          {nextClassData.status === "warning" && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <p>{nextClassData.statusMessage}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Button
              variant={leaveNow ? "destructive" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                setLeaveNow(!leaveNow);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 h-9 rounded-xl shadow-lg shadow-red-600/20"
            >
              {leaveNow ? "SMART LEAVE NOW (ACTIVE)" : "Check ETA & Departure"}
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/student/map");
              }}
              className="flex-1 border-white/10 text-white hover:bg-white/10 text-xs py-2 h-9 rounded-xl bg-white/5"
            >
              <Navigation className="h-3.5 w-3.5 mr-1.5 text-red-500" />
              Navigate Map
            </Button>
          </div>

          {leaveNow && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-red-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> NEXUS Smart Departure Recommendation
              </p>
              <p className="text-gray-300">
                Target: {nextClassData.startTime} in {nextClassData.room}. CSB Lift 2 currently has congestion.
              </p>
              <p className="text-white font-medium">
                Recommended Departure: <span className="text-red-400 font-bold">{nextClassData.recommendedLeave}</span> (Expected walk: {nextClassData.travelTime} min).
              </p>
            </div>
          )}
        </div>
      ),
    },

    // 2. Central Library — Bento Item (colSpan: 1)
    {
      title: library?.location_name || "Central Library",
      meta: library ? `${Math.round((library.current_count / (library.capacity || 120)) * 100)}% Occupied` : "Live Sync",
      description: library
        ? `${library.current_count} / ${library.capacity || 120} students present across study floors.`
        : "Live silent study floor and seat occupancy telemetry.",
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      status: getRushStatus(library?.rush_level),
      tags: ["Study", "Seats", "Quiet"],
      colSpan: 1,
      cta: "View Seats →",
      onClick: () => router.push("/student/pulse"),
    },

    // 3. Main Canteen — Bento Item (colSpan: 1)
    {
      title: canteen?.location_name || "Main Canteen",
      meta: canteen ? `${Math.round((canteen.current_count / (canteen.capacity || 150)) * 100)}% Full` : "Live Sync",
      description: canteen
        ? `${canteen.current_count} / ${canteen.capacity || 150} present. Lunch rush active.`
        : "Live dining telemetry and counter queue status.",
      icon: <UtensilsCrossed className="w-4 h-4 text-red-400" />,
      status: getRushStatus(canteen?.rush_level),
      tags: ["Food", "Dining", "Counters"],
      colSpan: 1,
      cta: "View Pulse →",
      onClick: () => router.push("/student/pulse"),
    },

    // 4. Vacant Rooms & Labs — Bento Item (colSpan: 1)
    {
      title: "Vacant Study Spaces",
      meta: "14 Available",
      description: "Quiet lecture halls, discussion pods, and computer lab terminals open now.",
      icon: <Users className="w-4 h-4 text-purple-400" />,
      status: "Available",
      tags: ["Quiet", "AC", "WiFi"],
      colSpan: 1,
      cta: "Find Space →",
      onClick: () => router.push("/student/explore"),
    },

    // 5. Maggi Point & Refreshments — Bento Item (colSpan: 1)
    {
      title: foodSpot?.location_name || "Maggi Point & Cafe",
      meta: foodSpot ? `${Math.round((foodSpot.current_count / (foodSpot.capacity || 50)) * 100)}%` : "~4 min wait",
      description: foodSpot
        ? `${foodSpot.current_count} / ${foodSpot.capacity || 50} customers in line.`
        : "Quick snacks, tea, and espresso rush level.",
      icon: <Coffee className="w-4 h-4 text-amber-400" />,
      status: getRushStatus(foodSpot?.rush_level),
      tags: ["Snacks", "Coffee", "Quick"],
      colSpan: 1,
      cta: "Queue Time →",
      onClick: () => router.push("/student/pulse"),
    },

    // 6. NEXUS Campus Copilot & Quick Ops — Hero Bento Item (colSpan: 2)
    {
      title: "NEXUS AI Campus Intelligence",
      meta: "GenAI Active",
      description: "Instant institutional copilot, classroom navigation, and campus operations.",
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      status: "Online",
      tags: ["Copilot", "Quick Ops", "Gemini 2.5"],
      colSpan: 2,
      cta: "Launch AI Chat →",
      onClick: () => router.push("/student/ai-chat"),
      children: (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-neutral-400 font-medium">Quick Operational Shortcuts:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsCommandOpen(true);
              }}
              className="justify-start border-white/10 hover:bg-white/10 text-white bg-white/5 text-xs h-9 px-2.5 rounded-xl"
            >
              <Search className="h-3.5 w-3.5 mr-1.5 text-red-500 flex-shrink-0" />
              <span className="truncate">Find Class</span>
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/student/faculty");
              }}
              className="justify-start border-white/10 hover:bg-white/10 text-white bg-white/5 text-xs h-9 px-2.5 rounded-xl"
            >
              <Users className="h-3.5 w-3.5 mr-1.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">Find Faculty</span>
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsReportModalOpen(true);
              }}
              className="justify-start border-white/10 hover:bg-white/10 text-white bg-white/5 text-xs h-9 px-2.5 rounded-xl"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">Report Issue</span>
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openBookDemo();
              }}
              className="justify-start border-white/10 hover:bg-white/10 text-white bg-white/5 text-xs h-9 px-2.5 rounded-xl"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Reserve Book</span>
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <StaggerContainer className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeUp>
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, Arjun</h1>
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase tracking-wider">
                Live Twin Connected
              </Badge>
            </div>
            <p className="text-sm text-gray-400">Somaiya Vidyavihar Digital Twin & Campus Operational Hub</p>
          </div>
          <Button
            onClick={() => setIsCommandOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-md self-start sm:self-auto shadow-lg shadow-black/20"
          >
            <Search className="w-3.5 h-3.5 text-red-500" />
            <span>Quick Search</span>
            <kbd className="px-1.5 py-0.5 bg-black/50 border border-white/10 rounded text-[10px] text-gray-300 font-mono">Ctrl+K</kbd>
          </Button>
        </div>
      </FadeUp>

      {/* Primary Campus Overview — Bento Grid Centerpiece */}
      <FadeUp>
        <BentoGrid items={dashboardBentoItems} />
      </FadeUp>

      {/* Location Tracking */}
      <FadeUp>
        <Card className="dashboard-card border-white/10 bg-neutral-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Live Campus Location Tracking</h2>
          </div>
          <LocationTrackingControl />
        </Card>
      </FadeUp>

      {/* Modals */}
      <IssueReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <GlobalCommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      <BookDetailsModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </StaggerContainer>
  );
}
