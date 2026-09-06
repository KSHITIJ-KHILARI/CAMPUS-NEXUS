"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, CheckCheck, Sparkles } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { BackButton } from "@/components/ui/back-button";

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  info: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotification } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Dashboard" fallbackPath="/student/dashboard" />
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllRead()}
            className="text-xs border-white/10 text-gray-300 hover:text-white flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notifications & AI Alerts</h1>
        <p className="text-gray-400">
          {unreadCount > 0
            ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
            : "You're all caught up with campus operational updates"}
        </p>
      </div>

      {isLoading && notifications.length === 0 && (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading notifications...
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`card-hover p-4 border-white/10 transition-all ${
              !notification.read ? "border-l-4 border-l-red-500 bg-red-950/10" : "opacity-80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className={priorityColors[notification.priority] || priorityColors.info}>
                    {notification.priority}
                  </Badge>
                  <span className="font-semibold text-white text-sm truncate">
                    {notification.event.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2 leading-relaxed">{notification.reason}</p>
                <p className="text-xs text-gray-500">
                  {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : "Just now"}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                    className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                  title="Delete notification"
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && (
        <Card className="p-12 text-center border-white/10">
          <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
          <p className="text-sm text-gray-400">You&apos;re completely up to date.</p>
        </Card>
      )}
    </div>
  );
}
