"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/hooks/api";

interface Notification {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/activities/notifications?limit=50");
      const data: Notification[] = (res.data?.data || []).filter(
        (n: Notification) => n.description !== "__DELETED__",
      );
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );

      try {
        // Persist to DB and then refresh to ensure server state is authoritative
        await api.patch(`/activities/notifications/${id}/read`);
        await fetchNotifications();
      } catch (err) {
        // Revert on failure and surface a console error
        console.error("Failed to mark notification read:", err);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
      }
    },
    [fetchNotifications],
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      // Optimistic remove
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await api.delete(`/activities/notifications/${id}`);
      } catch (error) {
        console.error("Failed to delete notification:", error);
        // Refetch to restore correct state
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        deleteNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  return context;
}
