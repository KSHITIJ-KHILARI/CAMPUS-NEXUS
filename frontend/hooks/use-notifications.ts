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
  data?: string | null;
  timestamp?: string | null;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const [unreadCount, setUnreadCount] = useState(0);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthToken(localStorage.getItem("auth_token"));
  }, []);

  const enabled = !!authToken;

  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.getAll() as unknown as Promise<NotificationItem[]>,
    enabled,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const {
    data: unreadData,
  } = useQuery<{ unread: number; count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.notifications.getUnread() as unknown as Promise<{ unread: number; count: number }>,
    enabled,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (unreadData && typeof unreadData.count === "number") {
      setUnreadCount(unreadData.count);
    }
  }, [unreadData]);

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

  return {
    notifications: (notifications ?? []) as NotificationItem[],
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllRead,
  };
}