import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  event: string;
  reason: string;
  priority: string;
  read: boolean;
  title?: string;
  data?: string | null;
  timestamp?: string | null;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = api.notifications.subscribeAll((data: any[]) => {
      const formatted = (data || []).map((n: any) => ({
        id: n.id,
        recipient_id: n.userId || "all",
        event: n.title || n.event || "Campus Alert",
        reason: n.message || n.reason || "",
        priority: n.severity === "danger" ? "high" : n.severity === "warning" ? "medium" : "info",
        read: !!n.read,
        timestamp: n.timestamp || new Date().toISOString(),
        title: n.title,
        link: n.link,
      }));
      setNotifications(formatted as NotificationItem[]);
      const unread = formatted.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
      setIsLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const refetch = useCallback(async () => {
    // No-op for real-time
  }, []);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [markAsReadMutation]
  );

  const markAllRead = useCallback(() => {
    markAllReadMutation.mutate();
    setUnreadCount(0);
  }, [markAllReadMutation]);

  const deleteNotification = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [deleteMutation]
  );

  return {
    notifications: (notifications ?? []) as NotificationItem[],
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllRead,
    deleteNotification,
  };
}