"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  ExternalLink,
  Compass,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Maximize2,
  Box,
  Eye,
  Info,
  Building2,
  Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import CampusDigitalTwin from "@/components/features/campus-digital-twin";
import { somaiyaBuildings, SomaiyaBuilding } from "@/lib/somaiyaCampusData";

const TOUR_360_URL = "https://iviewd.com/svu/";

export default function CampusTourPage() {
  const { user } = useAuth();
  const role = user?.role || "student";
  const [viewMode, setViewMode] = useState<"3d" | "360">("3d");
  const [showLocationList, setShowLocationList] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCampusData() {
      try {
        const [locations, state] = await Promise.all([
          api.location.getLocations().catch(() => []),
          api.digitalTwin.getCampusState().catch(() => null)
        ]);
        setHotspots(locations || []);
        if (state) setTelemetry(state);
      } catch {
        // Fallback to static Somaiya catalog
      }
    }
    loadCampusData();
  }, []);

  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  const handleSelectBuilding = (building: SomaiyaBuilding) => {
    setSelectedBuildingId(building.id);
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-4">
      {/* Header Info & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-xl bg-campus-primary/10 border border-campus-primary/20 text-campus-primary">
              <Compass className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Somaiya Vidyavihar Campus Digital Twin
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Interactive real-time 3D spatial model & 360° virtual walkthrough of KJSCE & SVU
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "3d"
                  ? "bg-campus-primary text-white shadow-md shadow-campus-primary/25"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5" /> 3D Digital Twin
            </button>
            <button
              onClick={() => setViewMode("360")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "360"
                  ? "bg-campus-primary text-white shadow-md shadow-campus-primary/25"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 360° Panorama
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLocationList(!showLocationList)}
            className="border-white/10 text-xs text-gray-300 hover:text-white hidden sm:inline-flex"
          >
            <Layers className="h-3.5 w-3.5 mr-1" />
            {showLocationList ? "Hide Directory" : "Show Directory"}
          </Button>

          {viewMode === "360" && (
            <a
              href={TOUR_360_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/10 text-xs text-gray-300 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Fullscreen
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Main View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Primary Interactive Viewer */}
        <div className={showLocationList ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="border-white/10 overflow-hidden bg-black/80 shadow-2xl relative">
            {viewMode === "3d" ? (
              <div className="relative w-full h-[620px] sm:h-[680px]">
                <CampusDigitalTwin
                  selectedBuildingId={selectedBuildingId}
                  onBuildingSelect={handleSelectBuilding}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="relative w-full h-[620px] sm:h-[680px]">
                <Suspense
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center bg-campus-card">
                      <div className="text-gray-400 flex flex-col items-center gap-2">
                        <Compass className="h-8 w-8 text-campus-primary animate-spin" />
                        <span>Loading 360° panoramic tour...</span>
                      </div>
                    </div>
                  }
                >
                  <iframe
                    src={TOUR_360_URL}
                    title="Somaiya Vidyavihar University 360° Virtual Campus Tour"
                    className="w-full h-full border-0"
                    allow="camera; microphone; accelerometer; encrypted-media; gyroscope"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    loading="lazy"
                  />
                </Suspense>
              </div>
            )}
          </Card>
        </div>

        {/* Somaiya POI Directory & Real-Time Sync Sidebar */}
        {showLocationList && (
          <div className="space-y-3 flex flex-col justify-between">
            <Card className="border-white/10 bg-campus-card/80 p-4 space-y-3 backdrop-blur shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-campus-primary" />
                  Somaiya Landmarks
                </h2>
                <Badge className="bg-campus-primary/20 text-campus-primary border-campus-primary/30 text-[10px] px-1.5 py-0">
                  {somaiyaBuildings.length} Facilities
                </Badge>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {somaiyaBuildings.map((building) => {
                  const isSelected = selectedBuildingId === building.id;
                  return (
                    <button
                      key={building.id}
                      onClick={() => {
                        setSelectedBuildingId(building.id);
                        if (viewMode !== "3d") setViewMode("3d");
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all group flex flex-col gap-1 ${
                        isSelected
                          ? "bg-campus-primary/20 border-campus-primary text-white shadow-md shadow-campus-primary/20"
                          : "bg-white/[0.02] border-white/5 hover:border-campus-primary/30 hover:bg-white/[0.05] text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white group-hover:text-campus-primary transition-colors line-clamp-1">
                          {building.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono px-1 py-0.5 rounded bg-black/40 border border-white/5 flex-shrink-0">
                          {building.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {building.overview}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                          {building.floors} Floors
                        </span>
                        <span className="text-[10px] text-campus-primary bg-campus-primary/10 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                          {building.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="border-white/10 bg-campus-primary/5 p-3.5 border-dashed rounded-xl">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-campus-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">
                    Live Geofenced Twin
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Click any building to fly the camera into position, inspect floorplans, real-time crowds, and lecture halls.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
