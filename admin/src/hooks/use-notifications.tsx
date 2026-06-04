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

const READ_KEY = "admin_read_notifications";

function getStoredReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(READ_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {}
}

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
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [rawNotifications, setRawNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getStoredReadIds);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/activities/notifications?limit=50");
      const data: Notification[] = res.data?.data || [];
      // Filter out soft-deleted notifications
      setRawNotifications(data.filter(n => n.description !== "__DELETED__"));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute notifications with isRead based on localStorage
  const notifications = rawNotifications.map(n => ({
    ...n,
    isRead: readIds.has(n.id),
  }));

  // Unread count — notifications not in readIds
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
    // Also tell the backend (fire and forget)
    api.patch(`/activities/notifications/${id}/read`).catch(() => {});
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    // Remove from local state immediately
    setRawNotifications(prev => prev.filter(n => n.id !== id));
    setReadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      saveReadIds(next);
      return next;
    });
    // Tell backend
    try {
      await api.delete(`/activities/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      // Don't revert — keep it removed from UI
    }
  }, []);

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
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
