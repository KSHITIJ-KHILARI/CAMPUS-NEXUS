"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, Eye, Navigation, AlertCircle, Wifi, Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useLocation } from "@/lib/location-context";
import { formatDistanceToNow } from "date-fns";

type PrivacyMode = "PRIVATE" | "APPROXIMATE" | "PRECISE_NAVIGATION";

const PRIVACY_MODES: { value: PrivacyMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "Location not shared for navigation or map positioning",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    value: "APPROXIMATE",
    label: "Approximate",
    description: "Campus zone only, used for nearby facilities and occupancy insights",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: "PRECISE_NAVIGATION",
    label: "Precise Navigation",
    description: "Live location for turn-by-turn navigation and walking ETA",
    icon: <Navigation className="h-4 w-4" />,
  },
];

export function LocationTrackingControl() {
  const { user } = useAuth();
  const {
    tracking,
    status,
    latitude,
    longitude,
    accuracy,
    lastTimestamp,
    matchedLocation,
    permissionDenied,
    error,
    enableTracking,
    disableTracking,
    refreshStatus,
  } = useLocation();

  const [consent, setConsent] = useState<{ is_enabled: boolean; privacy_mode: string } | null>(null);
  const [browserPermission, setBrowserPermission] = useState<string>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchConsent = async () => {
      try {
        const data = await api.presence.getConsent() as any;
        setConsent({ is_enabled: data.is_enabled, privacy_mode: data.privacy_mode });
      } catch {
        setConsent({ is_enabled: false, privacy_mode: "PRIVATE" });
      }
    };
    fetchConsent();

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((permStatus) => {
        setBrowserPermission(permStatus.state);
        permStatus.onchange = () => setBrowserPermission(permStatus.state);
      });
    }
  }, [user]);

  const handleToggle = async (enabled: boolean) => {
    if (!consent) return;
    setLoading(true);
    try {
      const newMode = enabled ? consent.privacy_mode : "PRIVATE";
      await api.presence.updateConsent({
        is_enabled: enabled,
        privacy_mode: newMode,
      });
      setConsent({ is_enabled: enabled, privacy_mode: newMode });

      if (enabled) {
        await enableTracking();
      } else {
        await disableTracking();
      }
      await refreshStatus();
    } catch (err) {
      console.error("Failed to update location consent:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "LIVE":
        return <Badge variant="success" className="text-xs">🟢 LIVE</Badge>;
      case "OFF":
        return <Badge variant="secondary" className="text-xs">⚪ OFF</Badge>;
      case "PERMISSION_DENIED":
        return <Badge variant="warning" className="text-xs">🔴 PERMISSION DENIED</Badge>;
      case "UNAVAILABLE":
        return <Badge variant="warning" className="text-xs">🟡 UNAVAILABLE</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">⚪ OFF</Badge>;
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "LIVE":
        return "Your real location is being received via device GPS";
      case "OFF":
        return "Location tracking is disabled";
      case "PERMISSION_DENIED":
        return "Browser denied location permission";
      case "UNAVAILABLE":
        return "Tracking enabled but current location cannot be obtained";
      default:
        return "Location sharing is disabled";
    }
  };

  if (!user) return null;

  if (!consent) {
    return (
      <div className="text-center py-4">
        <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
          Loading location settings...
        </div>
      </div>
    );
  }

  const isLive = status === "LIVE";

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
        Location Tracking
      </h3>
      <div className="space-y-3">
        {/* Status indicator */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <MapPin className={`h-4 w-4 ${
              isLive ? "text-emerald-400" : "text-gray-500"
            }`} />
            <div>
              <p className="text-sm font-medium text-white">Status</p>
              <p className="text-xs text-gray-400">
                {getStatusDescription()}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* ON/OFF Toggle */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <Navigation className="h-4 w-4 text-campus-primary" />
            <div>
              <p className="text-sm font-medium text-white">Location Tracking</p>
              <p className="text-xs text-gray-400">
                Enable to use campus map positioning and navigation
              </p>
            </div>
          </div>
          {consent.is_enabled && isLive ? (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleToggle(false)}
              disabled={loading}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
            >
              ON
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggle(true)}
              disabled={loading}
              className="h-8 px-3 border-white/20 text-gray-400 hover:text-white"
            >
              OFF
            </Button>
          )}
        </div>

        {/* Live location details (only when tracking) */}
        {tracking && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
            {latitude != null && longitude != null ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Coordinates</span>
                  <span className="text-white font-mono">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </span>
                </div>
                {accuracy != null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-white">±{Math.round(accuracy)} m</span>
                  </div>
                )}
                {lastTimestamp && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Updated</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(lastTimestamp), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {matchedLocation && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Nearest Location</span>
                    <span className="text-white">
                      {matchedLocation.name} ({Math.round(matchedLocation.distance_meters)} m away)
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">Acquiring GPS signal...</p>
            )}
          </div>
        )}

        {/* Privacy modes (only when enabled) */}
        {consent.is_enabled && browserPermission === "granted" && (
          <div>
            <label className="block text-xs text-gray-400 mb-2">Privacy Mode</label>
            <div className="space-y-1">
              {PRIVACY_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await api.presence.updateConsent({
                        is_enabled: true,
                        privacy_mode: mode.value,
                      });
                      setConsent({ is_enabled: true, privacy_mode: mode.value });
                    } catch (err) {
                      console.error("Failed to update privacy mode:", err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    consent.privacy_mode === mode.value
                      ? "border-campus-primary bg-campus-primary/10 text-white"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {mode.icon}
                  <div className="text-left">
                    <div className="text-xs font-medium">{mode.label}</div>
                    <div className="text-[10px] opacity-70">{mode.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Permission denied note */}
        {permissionDenied && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              Location permission was denied by your browser. Update your browser settings to enable location features.
            </p>
          </div>
        )}

        {/* API error note */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
