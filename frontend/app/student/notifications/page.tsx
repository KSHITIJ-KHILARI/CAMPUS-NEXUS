"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2 } from "lucide-react"
import { useState } from "react"

const notifications = [
  {
    id: "1",
    event: "Lift Unavailable",
    reason: "Aurobindo Lift 2 is unavailable. Your 2 PM class is on Floor 7.",
    priority: "high",
    timestamp: "2024-01-15T14:30:00Z",
    read: false,
    action: "View Route",
  },
  {
    id: "2",
    event: "Class Reminder",
    reason: "Java Practical starts in 30 minutes in Aurobindo Lab 304.",
    priority: "medium",
    timestamp: "2024-01-15T14:00:00Z",
    read: false,
    action: "Navigate",
  },
  {
    id: "3",
    event: "Campus Event",
    reason: "Hackathon registration closing in 2 hours.",
    priority: "low",
    timestamp: "2024-01-15T12:00:00Z",
    read: true,
    action: "Register",
  },
]

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications)

  const markAsRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const deleteNotification = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }

  const priorityColors = {
    high: "bg-campus-red/10 text-campus-red border-campus-red/20",
    medium: "bg-campus-yellow/10 text-campus-yellow border-campus-yellow/20",
    low: "bg-campus-blue/10 text-campus-blue border-campus-blue/20",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-gray-400">
          {items.filter((n) => !n.read).length} unread notifications
        </p>
      </div>

      <div className="space-y-3">
        {items.map((notification) => (
          <Card
            key={notification.id}
            className={`card-hover ${!notification.read ? "border-campus-blue/30" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={priorityColors[notification.priority as keyof typeof priorityColors]}>
                    {notification.priority}
                  </Badge>
                  <span className="font-medium text-white">{notification.event}</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{notification.reason}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
                {notification.action && (
                  <Button size="sm" variant="outline" className="mt-3">
                    {notification.action}
                  </Button>
                )}
              </div>
              <div className="flex gap-1 ml-4">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
          <p className="text-sm text-gray-400">You're all caught up!</p>
        </Card>
      )}
    </div>
  )
}
