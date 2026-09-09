"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Eye, Navigation } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

type PrivacyMode = "PRIVATE" | "APPROXIMATE" | "PRECISE_NAVIGATION";

const MODES: { value: PrivacyMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "No location sharing",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    value: "APPROXIMATE",
    label: "Approximate",
    description: "Campus zone only",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: "PRECISE_NAVIGATION",
    label: "Precise Navigation",
    description: "Live navigation mode",
    icon: <Navigation className="h-4 w-4" />,
  },
];

export function LocationConsentBanner() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [consent, setConsent] = useState<{ is_enabled: boolean; privacy_mode: string } | null>(null);
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
  }, [user]);

  const handleUpdateConsent = async (isEnabled: boolean, privacyMode: PrivacyMode) => {
    setLoading(true);
    try {
      await api.presence.updateConsent({
        is_enabled: isEnabled,
        privacy_mode: privacyMode,
      });
      setConsent({ is_enabled: isEnabled, privacy_mode: privacyMode });
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to update location consent:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !consent) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className={`border-white/10 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-2 ${
            consent.is_enabled ? "text-emerald-400 border-emerald-500/30" : "text-gray-400"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {consent.is_enabled ? (
            <span className="flex items-center gap-1">
              LOCATION SHARING <Badge variant="success" className="text-[10px] px-1 py-0">ON</Badge>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              LOCATION SHARING <Badge variant="secondary" className="text-[10px] px-1 py-0">OFF</Badge>
            </span>
          )}
        </Button>
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Location Sharing Settings"
        description="Control your campus location visibility. Location sharing is OFF by default."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <p className="text-sm font-medium text-white">Current Status</p>
              <p className="text-xs text-gray-400">
                {consent.is_enabled
                  ? `Sharing: ${consent.privacy_mode.replace(/_/g, " ")}`
                  : "Location sharing is disabled"}
              </p>
            </div>
            <Badge variant={consent.is_enabled ? "success" : "secondary"}>
              {consent.is_enabled ? "ON" : "OFF"}
            </Badge>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sharing Mode
            </label>
            <div className="space-y-2">
              {MODES.map((mode) => (
                <Button
                  key={mode.value}
                  variant={consent.privacy_mode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUpdateConsent(true, mode.value)}
                  disabled={loading}
                  className={`w-full justify-start gap-2 ${
                    consent.privacy_mode === mode.value
                      ? "bg-red-600 text-white"
                      : "border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {mode.icon}
                  <div className="text-left">
                    <div className="text-xs font-medium">{mode.label}</div>
                    <div className="text-[10px] opacity-80">{mode.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => handleUpdateConsent(false, "PRIVATE")}
            disabled={loading || !consent.is_enabled}
            className="w-full border-white/10 text-gray-300 hover:text-white"
          >
            Disable Location Sharing
          </Button>
        </div>
      </Dialog>
    </>
  );
}
