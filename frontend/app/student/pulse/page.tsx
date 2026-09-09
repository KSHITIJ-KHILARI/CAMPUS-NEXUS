"use client";

import dynamic from "next/dynamic";
import { Activity } from "lucide-react";

const Pulse = dynamic(() => import("@/components/features/pulse"), {
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-gray-400">
      <Activity className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading Campus Pulse...
    </div>
  ),
});

export default function StudentPulsePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white mb-1">Campus Pulse</h1>
        <p className="text-gray-400">Real-time campus density, crowd analytics, and noise telemetry</p>
      </div>
      <Pulse />
    </div>
  );
}
