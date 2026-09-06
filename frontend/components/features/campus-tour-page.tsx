"use client";

import { useState, Suspense } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TOUR_URL = "https://iviewd.com/svu/";

const SOMAIYA_HOTSPOTS = [
  {
    name: "Central Library & Knowledge Center",
    type: "Library",
    code: "SVU-LIB",
    description: "4 floors of study halls, book stacks & digital archives",
  },
  {
    name: "Aryabhata Building (KJSCE A-Block)",
    type: "Engineering Block",
    code: "KJSCE-A",
    description: "Main lecture auditoriums and department offices",
  },
  {
    name: "Bhaskaracharya Building (KJSCE B-Block)",
    type: "Engineering Block",
    code: "KJSCE-B",
    description: "Computer science labs, IoT research and seminar halls",
  },
  {
    name: "Somaiya Management Institute (SIMSR)",
    type: "Management Block",
    code: "SIMSR",
    description: "Executive lecture rooms, amphitheater & conference suites",
  },
  {
    name: "Somaiya Sports Complex & Grounds",
    type: "Athletics",
    code: "SVU-SAC",
    description: "Football turf, running track, basketball & indoor arena",
  },
  {
    name: "Engineering Main Canteen & Food Court",
    type: "Cafeteria",
    code: "FOOD-CT",
    description: "Multi-cuisine student cafeteria & beverage stations",
  },
];

export default function CampusTourPage() {
  const [showLocationList, setShowLocationList] = useState(true);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton label="Back to Dashboard" fallbackPath="/student/dashboard" />
        <div className="flex items-center gap-2">
          <Link href="/student/map">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 text-xs text-gray-300 hover:text-white"
            >
              <Layers className="h-3.5 w-3.5 text-campus-primary" />
              3D Digital Twin Map
            </Button>
          </Link>
          <Link href="/student/pulse">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 text-xs text-gray-300 hover:text-white"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Live Campus Pulse
            </Button>
          </Link>
          <a
            href={TOUR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 text-xs text-gray-300 hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </Button>
          </a>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="h-6 w-6 text-campus-primary animate-pulse" />
            360° Somaiya Campus Tour
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Immersive virtual walk-through of Somaiya Vidyavihar University campus facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-campus-primary/20 text-campus-primary border-campus-primary/30 gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            GPS Geofence Synchronized
          </Badge>
        </div>
      </div>

      {/* Main Tour Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 360 Viewer Card */}
        <Card className={`border-white/10 overflow-hidden bg-black ${showLocationList ? "lg:col-span-3" : "lg:col-span-4"}`}>
          <div className="relative w-full" style={{ height: "calc(100vh - 240px)", minHeight: "520px" }}>
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-campus-card">
                  <div className="text-gray-400 flex flex-col items-center gap-2">
                    <Compass className="h-8 w-8 text-campus-primary animate-spin" />
                    <span>Loading 360° campus tour...</span>
                  </div>
                </div>
              }
            >
              <iframe
                src={TOUR_URL}
                title="Somaiya Vidyavihar University 360° Virtual Campus Tour"
                className="w-full h-full border-0"
                allow="camera; microphone; accelerometer; encrypted-media; gyroscope"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                loading="lazy"
              />
            </Suspense>
          </div>
        </Card>

        {/* Campus POI & Quick Navigation Sidebar */}
        {showLocationList && (
          <div className="space-y-3 flex flex-col justify-between">
            <Card className="border-white/10 bg-campus-card/70 p-4 space-y-3 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-campus-primary" />
                  Key Campus Zones
                </h2>
                <span className="text-[11px] text-gray-400">Somaiya SVU</span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
                {SOMAIYA_HOTSPOTS.map((spot) => (
                  <div
                    key={spot.code}
                    className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-campus-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-medium text-white group-hover:text-campus-primary transition-colors">
                        {spot.name}
                      </p>
                      <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                        {spot.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                      {spot.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-campus-primary/5 p-3 border-dashed">
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-white">Live Telemetry Tip:</span> All locations match canonical GPS geofences used in the NEXUS Pulse and Digital Twin.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
