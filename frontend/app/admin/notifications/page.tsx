"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2 } from "lucide-react"

const notifications = [
  { id: "1", event: "Lift Unavailable", reason: "Aurobindo Lift 2 is unavailable", priority: "high", timestamp: "2024-01-15T14:30:00Z", read: false },
  { id: "2", event: "Class Reminder", reason: "Java Practical starts in 30 minutes", priority: "medium", timestamp: "2024-01-15T14:00:00Z", read: false },
]

export default function AdminNotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-gray-400">System alerts and updates</p>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`card-hover ${!notification.read ? "border-campus-blue/30" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={notification.priority === "high" ? "danger" : "warning"}>
                    {notification.priority}
                  </Badge>
                  <span className="font-medium text-white">{notification.event}</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{notification.reason}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1 ml-4">
                <Button variant="ghost" size="sm"><Check className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-gray-400" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
