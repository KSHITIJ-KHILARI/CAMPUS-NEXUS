"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Shield, MapPin, User } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";

export default function StudentSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400">Manage your preferences and location privacy</p>
      </div>

      <div className="space-y-4">
        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-white">Notifications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white">Class Reminders</span>
              </div>
              <Badge variant="success" className="text-xs">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <BellOff className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white">Email Alerts</span>
              </div>
              <Badge variant="secondary" className="text-xs">Disabled</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-white">Privacy</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-sm text-white">Data Sharing</p>
                <p className="text-xs text-gray-400">Your anonymized presence powers campus intelligence</p>
              </div>
              <Badge variant="success" className="text-xs">Opt-in</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-white">Location Privacy</h3>
          </div>
          <LocationTrackingControl />
        </Card>

        <Card className="p-5 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-white">Account</h3>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-campus-red border-campus-red/20 hover:bg-campus-red/10"
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}
