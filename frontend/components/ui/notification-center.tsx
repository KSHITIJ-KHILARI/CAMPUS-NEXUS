"use client"

import { createContext, useContext, ReactNode } from "react"
import { Bell, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNotifications as useNotificationsApi } from "@/hooks/use-notifications"
import { formatRelativeTime } from "@/lib/utils"

export interface NotificationItem {
  id: string
  event: string
  reason: string
  priority: string
  timestamp: string
  read: boolean
}

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => void
  markAllRead: () => void
  refetch: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    refetch,
  } = useNotificationsApi()

  return (
    <NotificationContext.Provider
      value={{
        notifications: (notifications ?? []) as NotificationItem[],
        unreadCount: unreadCount ?? 0,
        isLoading: !!isLoading,
        markAsRead,
        markAllRead: () => markAllRead(),
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const priorityColors: Record<string, string> = {
    high: "text-campus-red",
    medium: "text-campus-yellow",
    low: "text-campus-blue",
    info: "text-gray-400",
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-campus-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto z-50 p-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-campus-blue hover:text-campus-blue/80"
                  onClick={() => markAllRead()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {isLoading && (
                <div className="p-4 space-y-3">
                  <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                  <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                  <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                </div>
              )}
              {!isLoading && notifications.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-400">
                  You&apos;re all caught up.
                </div>
              )}
              {!isLoading &&
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      !notification.read ? "bg-campus-blue/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              notification.priority === "high"
                                ? "danger"
                                : notification.priority === "medium"
                                ? "warning"
                                : "default"
                            }
                          >
                            {notification.priority}
                          </Badge>
                          <span className="text-sm font-medium text-white truncate">
                            {notification.event}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 break-words">
                          {notification.reason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {mounted ? formatRelativeTime(notification.timestamp) : ""}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          aria-label="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}