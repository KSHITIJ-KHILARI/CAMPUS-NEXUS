"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { MapPin, Gauge, Clock, Shield, Save, Trash2, RefreshCw, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useLocation } from "@/lib/location-context";
import { RushInfo, CampusLocationInfo } from "@/lib/constants";

const RUSH_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
  { value: "VERY_HIGH", label: "Very High" },
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 1440, label: "Until manually disabled" },
];

import { motion } from "framer-motion";

export default function CampusControlCenter() {
  const { user } = useAuth();
  const { rushData, fetchRush, isLoadingRush, tracking } = useLocation();
  const [campusLocations, setCampusLocations] = useState<CampusLocationInfo[]>([]);
  const [overrides, setOverrides] = useState<Record<number, any>>({});
  const [editingLocation, setEditingLocation] = useState<CampusLocationInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const [locationsData] = await Promise.all([
        api.location.getLocations(),
      ]);
      setCampusLocations(locationsData as any as CampusLocationInfo[]);

      const overridesList = await api.location.getAdminOverrides();
      const overrideMap: Record<number, any> = {};
      for (const ov of overridesList as any[]) {
        overrideMap[ov.location_id] = ov;
      }
      setOverrides(overrideMap);

      fetchRush();
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setError(err?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getRushItem = (locationId: number): RushInfo | undefined => {
    return rushData?.find((r) => r.location_id === locationId);
  };

  const activeOverride = (locationId: number) => {
    const ov = overrides[locationId];
    if (!ov || !ov.is_active) return null;
    if (ov.expires_at && new Date(ov.expires_at) <= new Date()) return null;
    return ov;
  };

  const handleToggleOverride = async (locationId: number, isActive: boolean) => {
    if (!isActive) {
      const ov = overrides[locationId];
      if (ov) {
        try {
          await api.location.deleteAdminOverride(ov.id);
          const newOverrides = { ...overrides };
          delete newOverrides[locationId];
          setOverrides(newOverrides);
        } catch (err: any) {
          setError(err?.message || "Failed to remove override");
        }
      }
      return;
    }

    setEditingLocation(campusLocations.find((l) => l.id === locationId) || null);
  };

  const handleSaveOverride = async (locationId: number) => {
    const ov = overrides[locationId];
    if (!ov) return;
    setSaving(true);
    try {
      await api.location.createAdminOverride({
        location_id: locationId,
        people_count: ov.people_count,
        rush_level: ov.rush_level,
        reason: ov.reason,
        duration_minutes: ov.duration_minutes,
      });
      setOverrides({ ...overrides });
      setEditingLocation(null);
      await fetchAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to save override");
    } finally {
      setSaving(false);
    }
  };

  const handleNewOverride = (location: CampusLocationInfo) => {
    setEditingLocation(location);
    setOverrides({
      ...overrides,
      [location.id]: {
        people_count: 0,
        rush_level: "MODERATE",
        reason: "",
        duration_minutes: 30,
      },
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoadingRush}
          className="border-white/10 text-gray-400 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingRush ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Control Center</h1>
        <p className="text-gray-400">
          Manage campus operational state, geofence configuration, and rush intelligence overrides.
          GPS-derived aggregation is the default; admin overrides are clearly labeled.
        </p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-xs text-red-300">{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <MapPin className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold text-white">GPS Tracking</span>
            </div>
            <p className="text-xs text-gray-400 relative z-10">
              {tracking ? "Active — real GPS locations flowing" : "Inactive"}
            </p>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 border-white/10 bg-gradient-to-br from-campus-primary/10 to-transparent relative overflow-hidden group">
            <div className="absolute inset-0 bg-campus-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Gauge className="h-5 w-5 text-campus-primary" />
              <span className="text-sm font-semibold text-white">Campus Locations</span>
            </div>
            <p className="text-xs text-gray-400 relative z-10">{campusLocations.length} configured zones</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Shield className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">Active Overrides</span>
            </div>
            <p className="text-xs text-gray-400 relative z-10">
              {Object.values(overrides).filter((ov) => ov?.is_active).length} active manual overrides
            </p>
          </Card>
        </motion.div>
      </div>

      <div className="space-y-3">
        {campusLocations.map((loc) => {
          const rush = getRushItem(loc.id);
          const ov = activeOverride(loc.id);
          const isOverridden = !!ov;

          return (
            <Card key={loc.id} className="p-4 border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-white">{loc.name}</h3>
                    <p className="text-xs text-gray-400">
                      {loc.location_type} · Cap: {loc.capacity || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isOverridden ? (
                    <Badge variant="warning" className="text-xs">
                      OVERRIDE ACTIVE
                    </Badge>
                  ) : (
                    <Badge
                      variant={
                        rush?.rush_level === "VERY_HIGH" || rush?.rush_level === "HIGH"
                          ? "danger"
                          : rush?.rush_level === "MODERATE"
                          ? "warning"
                          : "success"
                    }
                      className="text-xs"
                    >
                      {rush?.rush_level || "NO DATA"}
                    </Badge>
                  )}

                  {isOverridden ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleOverride(loc.id, false)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNewOverride(loc)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Gauge className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {(ov && overrides[loc.id]) && editingLocation?.id === loc.id && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">People Count</label>
                      <Input
                        type="number"
                        min={0}
                        value={overrides[loc.id].people_count ?? 0}
                        onChange={(e) =>
                          setOverrides({
                            ...overrides,
                            [loc.id]: { ...overrides[loc.id], people_count: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Rush Level</label>
                      <select
                        value={overrides[loc.id].rush_level}
                        onChange={(e) =>
                          setOverrides({
                            ...overrides,
                            [loc.id]: { ...overrides[loc.id], rush_level: e.target.value },
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-campus-primary"
                      >
                        {RUSH_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration</label>
                      <select
                        value={String(overrides[loc.id].duration_minutes ?? 30)}
                        onChange={(e) =>
                          setOverrides({
                            ...overrides,
                            [loc.id]: { ...overrides[loc.id], duration_minutes: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-campus-primary"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Reason</label>
                      <Input
                        type="text"
                        placeholder="e.g. Event, Maintenance, Demo"
                        value={overrides[loc.id].reason ?? ""}
                        onChange={(e) =>
                          setOverrides({
                            ...overrides,
                            [loc.id]: { ...overrides[loc.id], reason: e.target.value },
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveOverride(loc.id)}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {saving ? "Saving..." : "Save Override"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingLocation(null);
                        const newOverrides = { ...overrides };
                        delete newOverrides[loc.id];
                        setOverrides(newOverrides);
                      }}
                      className="border-white/10 text-gray-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {rush && (
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Count</span>
                    <span className="text-white font-medium block">{rush.current_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence</span>
                    <span className="text-white font-medium block">{Math.round(rush.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Source</span>
                    <span className={`font-medium block ${
                      rush.source === "GPS"
                        ? "text-emerald-400"
                        : rush.source === "ADMIN_OVERRIDE"
                        ? "text-amber-400"
                        : "text-gray-400"
                    }`}>
                    {rush.source === "ADMIN_OVERRIDE" ? "Admin Override" : "GPS"}
                  </span>
                </div>
              </div>
              )}

              {!ov && !editingLocation?.id && !rush && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                  No rush data available for this location.
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {campusLocations.length === 0 && !isLoadingRush && (
        <Card className="p-8 border-white/10 text-center">
          <p className="text-gray-400">No campus locations configured.</p>
        </Card>
      )}
    </div>
  );
}
