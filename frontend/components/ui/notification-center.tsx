"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Trash2, CheckCircle2, AlertTriangle, BookOpen, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications as useNotificationsApi } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  event: string;
  reason: string;
  priority: string;
  timestamp: string;
  read: boolean;
  title?: string;
  link?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    deleteNotification,
    refetch,
  } = useNotificationsApi();

  return (
    <NotificationContext.Provider
      value={{
        notifications: (notifications ?? []) as NotificationItem[],
        unreadCount: unreadCount ?? 0,
        isLoading: !!isLoading,
        markAsRead,
        markAllRead: () => markAllRead(),
        deleteNotification,
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const prefersReduced = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number }>({
    top: 64,
    left: 268,
    width: 384,
  });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current && typeof window !== "undefined") {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(384, window.innerWidth - 32);
      // When opened from top-left sidebar, open to the right side into the visible page area
      let left = rect.left;
      if (rect.right < 280 && window.innerWidth >= 640) {
        left = Math.max(16, rect.right + 12);
      }
      // Ensure it never overflows off the right edge:
      if (left + width > window.innerWidth - 16) {
        left = window.innerWidth - 16 - width;
      }
      // Ensure it never overflows off the left edge:
      if (left < 16) {
        left = 16;
      }

      setDropdownCoords({
        top: Math.max(16, rect.bottom + 8),
        left,
        width,
      });
    }
  }, [isOpen]);

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.event.toLowerCase().includes("cancel")) {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    if (item.event.toLowerCase().includes("material") || item.event.toLowerCase().includes("note")) {
      return <BookOpen className="w-4 h-4 text-cyan-400" />;
    }
    if (item.event.toLowerCase().includes("event") || item.event.toLowerCase().includes("hackathon")) {
      return <Calendar className="w-4 h-4 text-purple-400" />;
    }
    return <Info className="w-4 h-4 text-[#A51C30]" />;
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
        aria-label="Campus Central Notifications"
      >
        <motion.div
          animate={unreadCount > 0 && !prefersReduced ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ repeat: Infinity, repeatDelay: 5, duration: 0.6, ease: "easeInOut" }}
        >
          <Bell className="h-5 w-5" />
        </motion.div>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={prefersReduced ? {} : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={prefersReduced ? {} : { scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="absolute -top-1 -right-1 bg-[#A51C30] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#0a0a0a]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: -8 }}
              transition={{
                duration: prefersReduced ? 0 : 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: "fixed",
                top: `${dropdownCoords.top}px`,
                left: `${dropdownCoords.left}px`,
                width: `${dropdownCoords.width}px`,
                transformOrigin: "top right",
              }}
              className="max-h-[520px] overflow-y-auto z-50 p-0 bg-[#141424] border border-white/15 shadow-2xl backdrop-blur-2xl rounded-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#10101c]/80 sticky top-0 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#A51C30]" />
                  <h3 className="font-bold text-sm text-white">Central Campus Inbox</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#A51C30]/20 text-[#A51C30] font-mono px-2 py-0.5 rounded-full border border-[#A51C30]/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    className="text-xs text-[#A51C30] hover:text-[#d33a50] font-medium transition-colors"
                    onClick={() => markAllRead()}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {isLoading && (
                  <div className="p-4 space-y-3">
                    <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                    <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                  </div>
                )}

                {!isLoading && notifications.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-white">You're all caught up!</p>
                    <p>No new timetable changes or campus alerts.</p>
                  </div>
                )}

                {!isLoading &&
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={prefersReduced ? {} : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: prefersReduced ? 0 : 0.2,
                        delay: prefersReduced ? 0 : index * 0.04,
                        ease: "easeOut",
                      }}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.link) {
                          setIsOpen(false);
                          router.push(notification.link);
                        }
                      }}
                      className={`p-4 hover:bg-white/5 transition-all cursor-pointer ${
                        !notification.read ? "bg-[#A51C30]/10 border-l-2 border-[#A51C30]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="p-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification)}
                        </span>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {notification.event}
                            </h4>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {mounted ? formatRelativeTime(notification.timestamp) : ""}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 break-words leading-relaxed line-clamp-3">
                            {notification.reason}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            {notification.link ? (
                              <span className="text-[10px] text-[#A51C30] flex items-center gap-1 font-semibold hover:underline">
                                View Section <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            ) : <div />}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-500 hover:text-red-400 p-1"
                              title="Clear"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}