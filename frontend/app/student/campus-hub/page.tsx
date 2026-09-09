"use client";

import { useState } from "react";
import { Compass, Map as MapIcon, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const CampusMapPage = dynamic(() => import("@/components/features/campus-map-page"), {
  loading: () => <div className="flex items-center justify-center h-[60vh] text-gray-400"><MapIcon className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading Campus Map...</div>,
});

const CampusTourPage = dynamic(() => import("@/components/features/campus-tour-page"), {
  loading: () => <div className="flex items-center justify-center h-[60vh] text-gray-400"><Compass className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading 3D Digital Twin...</div>,
  ssr: false,
});

const Pulse = dynamic(() => import("@/components/features/pulse"), {
  loading: () => <div className="flex items-center justify-center h-[60vh] text-gray-400"><Activity className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading Campus Pulse...</div>,
});

export default function CampusHubPage() {
  const [activeTab, setActiveTab] = useState<"map" | "tour" | "pulse">("map");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Campus Hub</h1>
          <p className="text-gray-400">Navigate, explore, and feel the pulse of the campus.</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "map"
                ? "bg-campus-primary text-white shadow-lg shadow-campus-primary/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MapIcon className="w-4 h-4" /> Campus Map
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "tour"
                ? "bg-campus-primary text-white shadow-lg shadow-campus-primary/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" /> 3D Digital Twin
          </button>
          <button
            onClick={() => setActiveTab("pulse")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "pulse"
                ? "bg-campus-primary text-white shadow-lg shadow-campus-primary/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" /> Campus Pulse
          </button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CampusMapPage />
            </motion.div>
          )}
          {activeTab === "tour" && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CampusTourPage />
            </motion.div>
          )}
          {activeTab === "pulse" && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Pulse />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
