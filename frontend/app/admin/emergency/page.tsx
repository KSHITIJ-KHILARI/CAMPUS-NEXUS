"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  User,
  Clock,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

type EmergencyStatus = "REPORTED" | "ACKNOWLEDGED" | "RESPONDER_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

const STATUS_OPTIONS: EmergencyStatus[] = [
  "REPORTED",
  "ACKNOWLEDGED",
  "RESPONDER_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-black",
  LOW: "bg-blue-500 text-white",
};

export default function AdminEmergencyPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const data = await api.emergency.getAll();
      setEmergencies(Array.isArray(data) ? data : []);
    } catch {
      setEmergencies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const handleStatusUpdate = async (id: string, status: EmergencyStatus) => {
    try {
      await api.emergency.updateStatus(id, { status });
      setActionMsg(`Emergency marked as ${status}`);
      fetchEmergencies();
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      setActionMsg("Failed to update status");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Emergency Dispatch Command Center</h1>
        <p className="text-gray-400">
          Monitor active campus emergencies, assign responders, and track resolution status
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {actionMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading emergency reports...
        </div>
      )}

      {!loading && emergencies.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">
          No active emergency reports. Campus is safe.
        </Card>
      )}

      <div className="space-y-4">
        {!loading &&
          emergencies.map((em) => (
            <Card key={em.id} className="p-5 border-white/10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-3 rounded-xl ${
                      em.severity === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : em.severity === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white text-base">{em.emergency_type}</h3>
                      <Badge className={SEVERITY_COLORS[em.severity] || "bg-gray-500 text-white"}>
                        {em.severity}
                      </Badge>
                      <Badge variant={em.status === "RESOLVED" ? "success" : "info"}>
                        {em.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">{em.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        {em.location_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-blue-400" />
                        {em.reporter_name || "Anonymous"}
                      </span>
                      {em.reporter_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          {em.reporter_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(em.created_at)}
                      </span>
                    </div>
                    {em.admin_notes && (
                      <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-300">
                        <span className="text-gray-400 block mb-0.5">Admin Notes:</span>
                        {em.admin_notes}
                      </div>
                    )}
                  </div>
                </div>

                {em.status !== "RESOLVED" && (
                  <div className="flex flex-col gap-2 self-end md:self-center">
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.filter((s) => s !== em.status).map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(em.id, status)}
                          className="text-xs border-white/10 text-gray-300 hover:text-white"
                        >
                          {status === "ACKNOWLEDGED" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {status === "RESPONDER_ASSIGNED" && <UserCheck className="w-3 h-3 mr-1" />}
                          {status === "IN_PROGRESS" && <Clock className="w-3 h-3 mr-1" />}
                          {status === "RESOLVED" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {status.replace(/_/g, " ")}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
