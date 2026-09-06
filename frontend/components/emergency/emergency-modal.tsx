"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Phone, User, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}

const EMERGENCY_TYPES = [
  { value: "MEDICAL", label: "Medical Emergency", icon: "🏥" },
  { value: "FIRE", label: "Fire / Smoke", icon: "🔥" },
  { value: "SECURITY", label: "Security Threat", icon: "🛡️" },
  { value: "FACILITY_HAZARD", label: "Facility Hazard", icon: "⚠️" },
  { value: "OTHER", label: "Other Emergency", icon: "❓" },
];

const SEVERITY_LEVELS = [
  { value: "CRITICAL", label: "Critical", color: "bg-red-600" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-500" },
  { value: "LOW", label: "Low", color: "bg-blue-500" },
];

export function EmergencyModal({ isOpen, onClose, onReported }: EmergencyModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emergencyType, setEmergencyType] = useState("MEDICAL");
  const [severity, setSeverity] = useState("HIGH");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  const handleSubmit = async () => {
    if (!locationName.trim() || !description.trim()) {
      setError("Location and description are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.emergency.report({
        emergency_type: emergencyType,
        severity,
        location_name: locationName,
        description,
        reporter_name: reporterName || user?.full_name || undefined,
        reporter_phone: reporterPhone || undefined,
      });
      onReported?.();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to report emergency. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmergencyType("MEDICAL");
    setSeverity("HIGH");
    setLocationName("");
    setDescription("");
    setReporterName("");
    setReporterPhone("");
    setError(null);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => { onClose(); resetForm(); }}
      title="NEXUS Emergency SOS"
      description="Report a campus emergency. This will alert campus security and administration immediately."
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Emergency Type</label>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={emergencyType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setEmergencyType(type.value)}
                className={
                  emergencyType === type.value
                    ? "bg-red-600 text-white"
                    : "border-white/10 text-gray-300 hover:text-white"
                }
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <Button
                key={level.value}
                variant={severity === level.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSeverity(level.value)}
                className={
                  severity === level.value
                    ? `${level.color} text-white`
                    : "border-white/10 text-gray-300 hover:text-white"
                }
              >
                {level.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. CSB 302, Library Entrance"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the emergency situation..."
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Optional"
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="Optional"
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => { onClose(); resetForm(); }}
            className="flex-1 border-white/10 text-gray-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {submitting ? "Reporting..." : "Report Emergency"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
