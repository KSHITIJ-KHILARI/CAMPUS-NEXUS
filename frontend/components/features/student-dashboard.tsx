"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function StudentDashboard() {
  const router = useRouter();
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, Arjun</h1>
          <p className="text-gray-400">Somaiya Vidyavihar Digital Twin & Campus Operational Hub</p>
        </div>
        <Button
          onClick={() => setIsCommandOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs px-3 py-2 rounded-xl flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5 text-red-500" />
          <span>Quick Search</span>
          <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] text-gray-300">Ctrl+K</kbd>
        </Button>
      </div>

      {/* Next Class Card */}
      <Card className="card-hover">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Next Upcoming Class</h2>
            <p className="text-2xl font-bold text-white">{nextClassData.subject}</p>
          </div>
          <Badge variant={nextClassData.status === "warning" ? "warning" : "default"}>
            {nextClassData.status === "warning" ? "Lift Notice" : "On Track"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-gray-400">Assigned Location</p>
              <p className="text-sm font-medium text-white">{nextClassData.room}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Scheduled Start</p>
              <p className="text-sm font-medium text-white">{nextClassData.startTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs text-gray-400">Starts In</p>
              <p className="text-sm font-medium text-white">{nextClassData.startsIn} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Est. Travel Time</p>
              <p className="text-sm font-medium text-white">{nextClassData.travelTime} min</p>
            </div>
          </div>
        </div>

        {nextClassData.status === "warning" && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-amber-400 text-xs">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p>{nextClassData.statusMessage}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant={leaveNow ? "destructive" : "default"}
            onClick={() => setLeaveNow(!leaveNow)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {leaveNow ? "SMART LEAVE NOW (ACTIVE)" : "Check ETA & Departure"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/student/map")}
            className="flex-1 border-white/10 text-white hover:bg-white/5"
          >
            <Navigation className="h-4 w-4 mr-2 text-red-500" />
            Navigate Map
          </Button>
        </div>

        {leaveNow && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
            <p className="text-red-400 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> NEXUS Smart Departure Recommendation
            </p>
            <p className="text-gray-300 mt-1">
              Your class starts at {nextClassData.startTime} in {nextClassData.room}. CSB Lift 2 currently has congestion.
            </p>
            <p className="text-white font-medium mt-1">
              Recommended Departure Time: <span className="text-red-400 font-bold">{nextClassData.recommendedLeave}</span> (Expected travel time: {nextClassData.travelTime} min).
            </p>
          </div>
        )}
      </Card>

      {/* Live Campus Telemetry */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          Live Campus Telemetry & Density
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const canteen = rushTelemetry.find((r: any) =>
              r.location_name?.toLowerCase().includes("canteen") || r.location_id === 5
            );
            const canteenLevel = (canteen?.rush_level || "LOW").toUpperCase();
            const canteenVariant = canteenLevel === "HIGH" || canteenLevel === "VERY_HIGH" ? "danger" : canteenLevel === "MODERATE" ? "warning" : "success";

            return (
              <Card className="card-hover cursor-pointer" onClick={() => router.push("/student/pulse")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{canteen?.location_name || "Main Canteen"}</p>
                      <p className="text-xs text-gray-400">
                        {canteen ? `${canteen.current_count} / ${canteen.capacity || 150} Present` : "Live telemetry sync"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={canteenVariant}>{canteenLevel.replace("_", " ")}</Badge>
                </div>
              </Card>
            );
          })()}

          {(() => {
            const library = rushTelemetry.find((r: any) =>
              r.location_name?.toLowerCase().includes("library") || r.location_id === 4
            );
            const libraryLevel = (library?.rush_level || "LOW").toUpperCase();
            const libraryVariant = libraryLevel === "HIGH" || libraryLevel === "VERY_HIGH" ? "danger" : libraryLevel === "MODERATE" ? "warning" : "success";

            return (
              <Card className="card-hover cursor-pointer" onClick={() => router.push("/student/pulse")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{library?.location_name || "Central Library"}</p>
                      <p className="text-xs text-gray-400">
                        {library ? `${library.current_count} / ${library.capacity || 120} Present` : "Live telemetry sync"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={libraryVariant}>{libraryLevel.replace("_", " ")}</Badge>
                </div>
              </Card>
            );
          })()}

          {(() => {
            const foodSpot = rushTelemetry.find((r: any) =>
              r.location_name?.toLowerCase().includes("maggi") ||
              r.location_name?.toLowerCase().includes("nescafe") ||
              r.location_id === 9
            );
            const foodLevel = (foodSpot?.rush_level || "LOW").toUpperCase();
            const foodVariant = foodLevel === "HIGH" || foodLevel === "VERY_HIGH" ? "danger" : foodLevel === "MODERATE" ? "warning" : "success";

            return (
              <Card className="card-hover cursor-pointer" onClick={() => router.push("/student/pulse")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                      <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{foodSpot?.location_name || "Maggi Point"}</p>
                      <p className="text-xs text-gray-400">
                        {foodSpot ? `${foodSpot.current_count} / ${foodSpot.capacity || 50} Present` : "Live telemetry sync"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={foodVariant}>{foodLevel.replace("_", " ")}</Badge>
                </div>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Functional Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Operational Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setIsCommandOpen(true)}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <MapPin className="h-4 w-4 mr-2 text-red-500" />
            Find Classroom
          </Button>
           <Button
             variant="outline"
             onClick={() => router.push("/student/faculty")}
             className="justify-start border-white/10 hover:bg-white/5 text-white"
           >
             <Users className="h-4 w-4 mr-2 text-blue-400" />
             Find Faculty
           </Button>
          <Button
            variant="outline"
            onClick={() => setIsReportModalOpen(true)}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
            Report Issue
          </Button>
          <Button
            variant="outline"
            onClick={openBookDemo}
            className="justify-start border-white/10 hover:bg-white/5 text-white"
          >
            <BookOpen className="h-4 w-4 mr-2 text-emerald-400" />
            Reserve Book
          </Button>
        </div>
      </Card>

      {/* Location Tracking */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-campus-primary" />
          <h2 className="text-lg font-semibold text-white">Location Tracking</h2>
        </div>
        <LocationTrackingControl />
      </Card>

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
    </div>
  );
}
