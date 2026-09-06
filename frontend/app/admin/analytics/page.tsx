"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, AlertTriangle } from "lucide-react"

export default function AnalyticsPage() {
  const utilizationData = [
    { building: "SSBAS", utilization: 78 },
    { building: "Aurobindo", utilization: 85 },
    { building: "Bhaskaracharya", utilization: 62 },
    { building: "Gargi Plaza", utilization: 45 },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Campus utilization and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4">Classroom Utilization</h3>
          <div className="space-y-3">
            {utilizationData.map((item) => (
              <div key={item.building} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.building}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-campus-blue rounded-full"
                      style={{ width: `${item.utilization}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {item.utilization}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4">Issue Trends</h3>
          <div className="space-y-3">
            {[
              { category: "Lift", count: 8 },
              { category: "Projector", count: 5 },
              { category: "WiFi", count: 3 },
              { category: "AC", count: 2 },
            ].map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-campus-red rounded-full"
                      style={{ width: `${item.count * 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4">Crowd Trends</h3>
          <div className="space-y-3">
            {[
              { time: "8:00 AM", level: "low" },
              { time: "10:00 AM", level: "moderate" },
              { time: "12:00 PM", level: "high" },
              { time: "2:00 PM", level: "moderate" },
              { time: "4:00 PM", level: "low" },
            ].map((item) => (
              <div key={item.time} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.time}</span>
                <Badge
                  variant={
                    item.level === "high"
                      ? "danger"
                      : item.level === "moderate"
                      ? "warning"
                      : "success"
                  }
                >
                  {item.level}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4">Faculty Availability</h3>
          <div className="space-y-3">
            {[
              { time: "9:00 AM", available: 12 },
              { time: "11:00 AM", available: 8 },
              { time: "2:00 PM", available: 15 },
            ].map((item) => (
              <div key={item.time} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.time}</span>
                <span className="text-sm text-white">{item.available} available</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
