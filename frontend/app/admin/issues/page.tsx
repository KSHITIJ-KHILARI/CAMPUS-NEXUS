"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  Sparkles,
  MapPin,
  User as UserIcon,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";

export default function IssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res: any = await api.admin.getIssues();
      const data = Array.isArray(res) ? res : res?.items || [];
      setIssues(data);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleAssign = async (issueId: string) => {
    try {
      await api.issues.assign(issueId, "EMP_MAINT_01");
      setActionMsg(`Issue assigned to Maintenance Team EMP_MAINT_01`);
      fetchIssues();
      setTimeout(() => setActionMsg(""), 2500);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to assign issue");
    }
  };

  const handleResolve = async (issueId: string) => {
    try {
      await api.issues.update(issueId, { status: "resolved" });
      setActionMsg(`Issue successfully marked as RESOLVED!`);
      fetchIssues();
      setTimeout(() => setActionMsg(""), 2500);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to resolve issue");
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          size="sm"
          variant="outline"
          onClick={fetchIssues}
          className="border-white/10 text-gray-300 hover:text-white text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus Incident & Infrastructure Control</h1>
        <p className="text-gray-400">Review reported equipment/facility issues, assign maintenance staff, and update resolutions</p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading incident reports from Firestore...
        </div>
      )}

      {!loading && issues.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No active incident reports found.</Card>
      )}

      <div className="space-y-4">
        {!loading &&
          issues.map((iss) => (
            <Card key={iss.id} className="card-hover p-5 border-white/10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mt-1">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white text-base">{iss.title}</h3>
                      <Badge variant={iss.priority === "high" ? "danger" : iss.priority === "critical" ? "danger" : iss.priority === "medium" ? "warning" : "default"}>
                        {iss.priority}
                      </Badge>
                      <Badge variant={iss.status === "resolved" ? "success" : iss.status === "in_progress" ? "info" : "warning"}>
                        {iss.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">
                      {iss.description || `Location: ${iss.location}`}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        <span>
                          {iss.location}
                          {iss.location_type && (
                            <span className="text-gray-500"> ({iss.location_type})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-purple-400" />
                        <span>Category: {iss.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-blue-400" />
                        <span>
                          Reporter: {iss.reporter_name || "Anonymous"}
                          {iss.reporter_role && (
                            <Badge variant="default" className="ml-1.5 text-[10px]">
                              {iss.reporter_role}
                            </Badge>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Reported: {formatTime(iss.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{iss.report_count || 1} report(s)</span>
                      {iss.assigned_to && <span>Assigned: {iss.assigned_to}</span>}
                      {iss.resolved_at && <span className="text-emerald-400">Resolved: {formatTime(iss.resolved_at)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {iss.status !== "resolved" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssign(iss.id)}
                        className="border-white/10 text-xs text-gray-300 hover:text-white"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-400" /> Assign Staff
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolve(iss.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                      </Button>
                    </>
                  )}
                  {iss.status === "resolved" && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
