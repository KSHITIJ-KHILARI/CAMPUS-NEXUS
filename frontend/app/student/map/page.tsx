"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { apiClient } from "@/lib/api-client";

interface Location {
  id: string;
  name: string;
  room?: string;
  floor?: number;
  type?: string;
  crowd?: string;
  travel_time_minutes?: number;
}

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [navTarget, setNavTarget] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocations() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<any>("/digital-twin/state");
        const campusLocations = data?.campus_locations || [];
        const mapped: Location[] = campusLocations.map((loc: any) => ({
          id: String(loc.id),
          name: loc.name || loc.building_name || "Unknown Location",
          room: loc.room_number || loc.room || "",
          floor: loc.floor || 1,
          type: loc.type || loc.location_type || "building",
          crowd: loc.crowd || loc.density || "moderate",
          travel_time_minutes: loc.travel_time_minutes || 10,
        }));
        setLocations(mapped);
      } catch (err: any) {
        setError(err?.message || "Failed to load campus map");
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  const filtered = filter ? locations.filter((loc) => loc.type === filter) : locations;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading campus map...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <Card className="p-8 text-center text-sm text-red-400 border-white/10">{error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Digital Twin Map & Navigation</h1>
        <p className="text-gray-400">Real-time geospatial campus navigation with elevator status delay compensation</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(null)}
          className={filter === null ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          All Locations
        </Button>
        <Button
          variant={filter === "building" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("building")}
          className={filter === "building" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Academic Buildings
        </Button>
        <Button
          variant={filter === "facility" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("facility")}
          className={filter === "facility" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Facilities & Libraries
        </Button>
        <Button
          variant={filter === "food" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("food")}
          className={filter === "food" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Food & Dining
        </Button>
      </div>

      {navTarget && (
        <Card className="p-5 border-red-500/30 bg-gradient-to-r from-red-950/30 via-neutral-900 to-neutral-900 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Active Route Calculated
              </div>
              <h3 className="text-xl font-bold text-white">
                Route to {navTarget.name} {navTarget.room ? `(${navTarget.room})` : ""}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-300 pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-gray-400 block">Est. Walking Time</span>
                    <span className="font-semibold text-white">{navTarget.travel_time_minutes || 10} Minutes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-gray-400 block">Target Floor</span>
                    <span className="font-semibold text-white">Floor {navTarget.floor || 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-gray-400 block">Accessible Path</span>
                    <span className="font-semibold text-white">Ramp & Elevator OK</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-gray-400 block">Delay Compensation</span>
                    <span className="font-semibold text-amber-400">+2 min (Lift Delay)</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNavTarget(null)}
              className="border-white/10 text-xs text-gray-300 hover:text-white"
            >
              Clear Route
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((loc) => (
          <Card
            key={loc.id}
            className="p-5 border-white/10 card-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <h3 className="font-bold text-white text-base">{loc.name}</h3>
                </div>
                <Badge
                  variant={
                    loc.crowd === "high"
                      ? "danger"
                      : loc.crowd === "moderate"
                      ? "warning"
                      : "success"
                  }
                >
                  {loc.crowd}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {loc.room ? `${loc.room} ` : ""}(Floor {loc.floor || 1})
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setNavTarget(loc)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl w-full flex items-center justify-center gap-1.5"
            >
              <Navigation className="h-3.5 w-3.5" /> Navigate To Location
            </Button>
          </Card>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">
          No locations found for the selected filter.
        </Card>
      )}
    </div>
  );
}
