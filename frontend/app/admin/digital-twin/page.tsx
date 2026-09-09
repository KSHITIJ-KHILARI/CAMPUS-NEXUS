"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { 
  Compass, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Users, 
  Building2, 
  Activity, 
  Bell, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sliders
} from "lucide-react";
import dynamic from "next/dynamic";
import { Compass } from "lucide-react";

const CampusDigitalTwin = dynamic(() => import("@/components/features/campus-digital-twin"), {
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-gray-400">
      <Compass className="w-5 h-5 animate-pulse mr-2 text-campus-primary" />Loading 3D Digital Twin...
    </div>
  ),
  ssr: false,
});

import { somaiyaBuildings, SomaiyaBuilding } from "@/lib/somaiyaCampusData";
import { addCentralNotification } from "@/lib/relationalCampusData";

export default function AdminDigitalTwinPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<SomaiyaBuilding | null>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [hvacEnergyMode, setHvacEnergyMode] = useState<"eco" | "balanced" | "max">("balanced");
  const [lightingOverride, setLightingOverride] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const handleToggleEmergency = () => {
    const newState = !emergencyActive;
    setEmergencyActive(newState);

    if (newState) {
      addCentralNotification({
        title: "EMERGENCY DRILL ACTIVATED: Somaiya Campus",
        message: "Digital Twin beacons switched to high-priority strobe. Security personnel alerted.",
        type: "event",
      });
      setActionMessage("Campus Emergency Protocol active. Beacon strobe enabled.");
    } else {
      addCentralNotification({
        title: "Emergency Protocol Stand-Down",
        message: "Campus digital twin returned to normal operating telemetry.",
        type: "system",
      });
      setActionMessage("Emergency Protocol cancelled. Normal telemetry restored.");
    }

    setTimeout(() => setActionMessage(""), 3500);
  };

  const handleHvacChange = (mode: "eco" | "balanced" | "max") => {
    setHvacEnergyMode(mode);
    setActionMessage(`Campus HVAC set to ${mode.toUpperCase()} mode.`);
    setTimeout(() => setActionMessage(""), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-[#A51C30]/20 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
            <Badge className="bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-semibold uppercase tracking-wider">
              Admin Facility Twin
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-red-500" />
            Somaiya Campus 3D Digital Twin & Botanical Engine
          </h1>
          <p className="text-neutral-400 text-sm max-w-2xl">
            Real-time interactive 3D twin of Somaiya Vidyavihar campus with animated botanical foliage, live telemetry, building inspection, and emergency beacon controls.
          </p>
        </div>

        {/* Emergency Broadcast Action */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleToggleEmergency}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg ${
              emergencyActive
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-600/50"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            {emergencyActive ? "Stop Emergency Drill" : "Trigger Emergency Beacon"}
          </Button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* Admin KPI Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Tracked Buildings</span>
            <Building2 className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{somaiyaBuildings.length} Units</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">100% Online Telemetry</div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Botanical Motion</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">Active 3D</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Swaying Trees & Pollen</div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Energy & HVAC</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 mt-1 uppercase">{hvacEnergyMode}</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">74% Grid Efficiency</div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Campus Status</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">Nominal</div>
          <div className="text-[11px] text-blue-400 mt-0.5">Zero Safety Hazards</div>
        </div>
      </div>

      {/* Embedded 3D Digital Twin Viewer */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
        <CampusDigitalTwin
          onBuildingSelect={(b) => setSelectedBuilding(b)}
          selectedBuildingId={selectedBuilding?.id}
        />
      </div>

      {/* Admin Controls Drawer */}
      <Card className="p-5 bg-neutral-900/60 border-white/10 rounded-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-bold text-white">Facility Telemetry Overrides</h3>
          </div>
          <span className="text-xs text-neutral-400">Affects all live digital twin simulations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* HVAC Profile */}
          <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-white/5">
            <label className="text-xs font-semibold text-neutral-300">Central HVAC Profile</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleHvacChange("eco")}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  hvacEnergyMode === "eco" ? "bg-emerald-600 text-white" : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Eco
              </button>
              <button
                onClick={() => handleHvacChange("balanced")}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  hvacEnergyMode === "balanced" ? "bg-blue-600 text-white" : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Balanced
              </button>
              <button
                onClick={() => handleHvacChange("max")}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  hvacEnergyMode === "max" ? "bg-amber-600 text-white" : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Full
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">Regulates air handling units across SSBAS and Granthagar.</p>
          </div>

          {/* Exterior Lighting Schedule */}
          <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-white/5">
            <label className="text-xs font-semibold text-neutral-300">Exterior Pathway Lighting</label>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-neutral-400">
                Status: <strong className={lightingOverride ? "text-yellow-400" : "text-neutral-300"}>{lightingOverride ? "Forced ON" : "Auto (Dusk)"}</strong>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLightingOverride(!lightingOverride);
                  setActionMessage(lightingOverride ? "Lighting reset to astronomical clock." : "Pathway lighting forced ON.");
                  setTimeout(() => setActionMessage(""), 3000);
                }}
                className="text-xs border-white/15 hover:bg-white/10 text-neutral-200 h-8"
              >
                Toggle Override
              </Button>
            </div>
            <p className="text-[11px] text-neutral-500">Controls bollards and South Boulevard tree avenue fixtures.</p>
          </div>

          {/* Quick Building Inspector */}
          <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-white/5">
            <label className="text-xs font-semibold text-neutral-300">Building Quick Select</label>
            <select
              value={selectedBuilding?.id || ""}
              onChange={(e) => {
                const b = somaiyaBuildings.find((item) => item.id === e.target.value);
                if (b) setSelectedBuilding(b);
              }}
              className="w-full px-3 py-1.5 bg-neutral-900 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="">Select a building to inspect...</option>
              {somaiyaBuildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-500">Transfers camera focus and brings up architectural metadata.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
