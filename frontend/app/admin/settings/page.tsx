"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Globe, Activity, MapPin } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Link href="/admin/system-health">
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-2">
            <Activity className="w-4 h-4" /> System Health Diagnostics
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus NEXUS Settings</h1>
        <p className="text-gray-400">Institutional system configurations, single key parameters, and operational preferences</p>
      </div>

      <div className="space-y-4">
        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-white">Security & API Credentials</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">Single Central Secret (NEXUS_API_KEY)</p>
                <p className="text-xs text-gray-400">Server-side configuration loaded from .env.local</p>
              </div>
              <Badge variant="success">Configured Server-Side Only</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">JWT Bearer Session Timeout</p>
                <p className="text-xs text-gray-400">Signed with HS256 algorithm</p>
              </div>
              <Badge variant="info">30 minutes</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-white">Student & Faculty Alerts</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">Automated Classroom Relocation Alerts</p>
                <p className="text-xs text-gray-400">Dispatches notification when room changes occur</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">Library Reservation Expiry Alerts</p>
                <p className="text-xs text-gray-400">Notifies students 24 hours prior to deadline</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </div>
        </Card>

         <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-white">Location & GPS Tracking</h3>
          </div>
          <LocationTrackingControl />
        </Card>

         <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-white">Campus Digital Twin Configuration</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">Institutional Identity</p>
                <p className="text-xs text-gray-400">Somaiya Vidyavihar University</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">Firestore Database Engine</p>
                <p className="text-xs text-gray-400">Relational digital twin store (59 tables)</p>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
