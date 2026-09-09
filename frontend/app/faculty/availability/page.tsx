"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { api } from "@/lib/api-client";

interface AvailabilityData {
  faculty_id: string;
  faculty_name: string;
  is_available: boolean;
  office_location: string;
  available_slots: Array<{ day: string; start: string; end: string; location: string }>;
}

export default function FacultyAvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [officeLocation, setOfficeLocation] = useState("");

  const fetchAvailability = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.faculty.getAvailability();
      const avail = data as AvailabilityData;
      setAvailability(avail);
      setIsAvailable(avail.is_available);
      setOfficeLocation(avail.office_location);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await api.faculty.setAvailability({
        is_available: isAvailable,
        office_location: officeLocation,
      });
      setStatusMsg("Availability updated successfully");
      setTimeout(() => setStatusMsg(""), 3000);
      setAvailability(res as AvailabilityData);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
        </div>
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> Loading availability...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Faculty Office Hours & Availability</h1>
        <p className="text-gray-400">Configure weekly office hours and student consultation slots</p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <Card className="p-6 border-white/10">
        <h3 className="font-bold text-white mb-4">Availability Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-300">
              {isAvailable ? "Currently accepting student consultations" : "Not available for consultations"}
            </span>
          </div>
          <Button
            variant={isAvailable ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsAvailable(!isAvailable)}
            className="rounded-xl"
          >
            {isAvailable ? "Set Unavailable" : "Set Available"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-white/10">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-400" /> Office Location
        </h3>
        <input
          type="text"
          value={officeLocation}
          onChange={(e) => setOfficeLocation(e.target.value)}
          placeholder="Enter office location (e.g., SSBAS Room 308)"
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </Card>

      {availability && availability.available_slots?.length > 0 && (
        <Card className="p-6 border-white/10">
          <h3 className="font-bold text-white mb-4">Weekly Office Hours</h3>
          <div className="space-y-2">
            {availability.available_slots?.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-sm text-gray-300 font-medium">{slot.day}</span>
                <span className="text-xs text-gray-400">
                  {slot.start} - {slot.end}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
