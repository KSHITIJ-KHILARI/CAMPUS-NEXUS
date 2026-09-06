"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Clock } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLocation } from "@/lib/location-context";
import { RushInfo } from "@/lib/constants";
import { RUSH_LEVELS } from "@/lib/constants";

export default function Pulse() {
  const { rushData, isLoadingRush, fetchRush, tracking, campusLocations } = useLocation();
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchRush();
  }, [fetchRush]);

  const rushDataArray: RushInfo[] = rushData ?? [];
  const knownLocations = campusLocations ?? [];

  // Build display data: use rush data if available, fall back to known campus locations
  const hasRushData = rushDataArray.length > 0;
  const displayData: RushInfo[] = hasRushData
    ? rushDataArray
    : knownLocations.map((loc) => ({
        location_id: loc.id,
        location_name: loc.name,
        current_count: 0,
        capacity: loc.capacity,
        rush_level: "LOW",
        confidence: 0.5,
        source: "NO_GPS_DATA",
        last_updated: new Date().toISOString(),
      }));

  const data = displayData;

  const filteredData = filter
    ? data.filter((item) => {
        const level = item.rush_level.toLowerCase().replace(/_/g, "");
        if (filter === "high") return level === "veryhigh" || level === "high";
        return level === filter;
      })
    : data;

  const levelConfig: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
    low: { variant: "success", label: "Low Activity" },
    moderate: { variant: "warning", label: "Moderate" },
    high: { variant: "danger", label: "High Activity" },
    very_high: { variant: "danger", label: "Very High Activity" },
  };

  const getRushLevelVariant = (level: string): { variant: "default" | "success" | "warning" | "danger" | "info"; label: string } => {
    const normalized = level.toLowerCase().replace("_", "");
    if (normalized.includes("very_high")) return levelConfig["very_high"];
    if (normalized.includes("high")) return levelConfig["high"];
    if (normalized.includes("moderate")) return levelConfig["moderate"];
    if (normalized.includes("low")) return levelConfig["low"];
    return { variant: "info", label: "Unknown" };
  };

  if (isLoadingRush && !rushData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Campus Pulse &amp; Density Telemetry</h1>
          <p className="text-gray-400">
            Real-time crowd intelligence aggregated from real GPS device locations and campus sensors
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-white/10 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 bg-white/10 rounded-md" />
                <div className="h-5 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-white/5 rounded-md" />
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        {tracking && (
          <Badge variant="success" className="text-xs">
            🟢 GPS Tracking Active
          </Badge>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Pulse & Density Telemetry</h1>
        <p className="text-gray-400">
          Real-time crowd intelligence aggregated from real GPS device locations and campus sensors
        </p>
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
          variant={filter === "high" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("high")}
          className={filter === "high" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          High Activity
        </Button>
        <Button
          variant={filter === "moderate" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("moderate")}
          className={filter === "moderate" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Moderate
        </Button>
        <Button
          variant={filter === "low" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("low")}
          className={filter === "low" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Low Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((item) => {
          const config = getRushLevelVariant(item.rush_level);
          return (
            <Card key={item.location_id} className="card-hover p-5 border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-base">{item.location_name}</h3>
                  <p className="text-xs text-gray-400">
                    Updated {new Date(item.last_updated).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current Presence</span>
                  <span className="text-white font-medium">
                    {item.current_count}
                    {item.capacity ? ` / ${item.capacity}` : ""}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.rush_level === "VERY_HIGH"
                        ? "bg-red-500"
                        : item.rush_level === "HIGH"
                        ? "bg-orange-500"
                        : item.rush_level === "MODERATE"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: item.capacity
                        ? `${Math.min(100, (item.current_count / item.capacity) * 100)}%`
                        : `${Math.min(100, (item.current_count / 20) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Confidence</span>
                  <span className="text-white font-medium">{Math.round(item.confidence * 100)}%</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-400">Source</span>
                   <span className={`font-medium ${
                     item.source === "GPS"
                       ? "text-emerald-400"
                       : item.source === "ADMIN_OVERRIDE"
                       ? "text-amber-400"
                       : item.source === "NO_GPS_DATA"
                       ? "text-gray-500"
                       : "text-gray-400"
                   }`}>
                     {item.source === "ADMIN_OVERRIDE" ? "Admin Override" : item.source === "NO_GPS_DATA" ? "Known Location" : "GPS Device"}
                   </span>
                </div>

                {item.source === "ADMIN_OVERRIDE" && item.override_reason && (
                  <div className="pt-1">
                    <span className="text-xs text-gray-500">Reason: {item.override_reason}</span>
                  </div>
                )}

                {item.expires_at && item.source === "ADMIN_OVERRIDE" && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Expires: {new Date(item.expires_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredData.length === 0 && !isLoadingRush && (
          <div className="col-span-2 text-center py-10 text-gray-500">
            {filter
              ? `No locations match the "${filter}" filter. Try "All Locations" to see all campus locations.`
              : knownLocations.length === 0
              ? "No campus locations found."
              : "Enable location tracking to see live campus pulse data. Showing all known campus locations with zero activity."}
          </div>
        )}
      </div>
    </div>
  );
}
