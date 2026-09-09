"use client";

import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

const CampusMapPage = dynamic(() => import("@/components/features/campus-map-page"), {
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-gray-400">
      <MapIcon className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading Campus Map...
    </div>
  ),
});

export default function StudentMapPage() {
  return <CampusMapPage />;
}
