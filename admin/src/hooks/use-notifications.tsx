"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { api } from "@/hooks/api";

interface Notification {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  isRead?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/activities/notifications?limit=50");
      setNotifications(res.data?.data || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistically update UI immediately
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev: number) => Math.max(0, prev - 1));
    // Persist to backend
    try {
      await api.patch(`/activities/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert on failure
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) =>
          n.id === id ? { ...n, isRead: false } : n
        )
      );
      setUnreadCount((prev: number) => prev + 1);
    }
  };

  const deleteNotification = async (id: string) => {
    const toDelete = notifications.find((n) => n.id === id);
    // Optimistically remove from UI immediately
    setNotifications((prev: Notification[]) => prev.filter((n) => n.id !== id));
    if (toDelete && !toDelete.isRead) {
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    }
    // Persist to backend
    try {
      await api.delete(`/activities/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      // Revert on failure — add it back
      if (toDelete) {
        setNotifications((prev) => [toDelete, ...prev]);
        if (!toDelete.isRead) setUnreadCount((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
