"use client";

import { useRef } from "react";
import { RushInfo } from "@/lib/constants";

interface CampusMapProps {
  rushData: RushInfo[];
  onSelectLocation?: (locationId: number) => void;
}

const MOCK_MAP_ZONES = [
  { id: 1, name: "SSBAS (CSB)", x: 20, y: 30, w: 25, h: 20 },
  { id: 2, name: "Aurobindo", x: 50, y: 25, w: 25, h: 25 },
  { id: 3, name: "Central Library", x: 30, y: 60, w: 20, h: 15 },
  { id: 4, name: "Somaiya Canteen", x: 60, y: 65, w: 15, h: 15 },
  { id: 5, name: "Sports Ground", x: 80, y: 40, w: 15, h: 40 },
];

export function CampusSVGMap({ rushData, onSelectLocation }: CampusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);



  const getRushColor = (zoneName: string) => {
    const rush = rushData.find((r) => r.location_name?.includes(zoneName.split(" ")[0]));
    if (!rush) return "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
    
    if (rush.rush_level === "VERY_HIGH" || rush.rush_level === "HIGH") {
      return "bg-red-500/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse";
    }
    if (rush.rush_level === "MODERATE") {
      return "bg-amber-500/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]";
    }
    return "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
  };

  return (
    <div ref={mapRef} className="relative w-full aspect-video bg-black/40 border border-white/10 rounded-2xl overflow-hidden glass-dark">
      {/* Grid Background overlay */}
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      
      {MOCK_MAP_ZONES.map((zone) => (
        <div
          key={zone.id}
          onClick={() => onSelectLocation?.(zone.id)}
          className={`map-zone absolute flex items-center justify-center cursor-pointer transition-all hover:scale-105 border-2 backdrop-blur-md rounded-xl ${getRushColor(zone.name)}`}
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.w}%`,
            height: `${zone.h}%`,
          }}
        >
          <span className="text-white font-bold text-xs md:text-sm text-center px-2 drop-shadow-md">
            {zone.name}
          </span>
        </div>
      ))}
    </div>
  );
}
