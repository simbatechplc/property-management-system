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

const ADMIN_USER_KEY = "admin_session_user";
const LOCAL_READ_PREFIX = "admin_notification_read_";

function getCurrentUserId(): string | null {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_USER_KEY)
        : null;
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id || null;
  } catch {
    return null;
  }
}

function loadLocalReadSet(userId: string | null) {
  try {
    const key = `${LOCAL_READ_PREFIX}${userId || "anonymous"}`;
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return new Set<string>();
    return new Set<string>(JSON.parse(raw));
  } catch {
    return new Set<string>();
  }
}

function saveLocalReadSet(userId: string | null, set: Set<string>) {
  try {
    const key = `${LOCAL_READ_PREFIX}${userId || "anonymous"}`;
    if (typeof window !== "undefined")
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

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
      const raw: Notification[] = (res.data?.data || []).filter(
        (n: Notification) => n.description !== "__DELETED__",
      );

      console.log('[fetchNotifications] Fetched notifications:', {
        total: raw.length,
        unread: raw.filter(n => !n.isRead).length,
        read: raw.filter(n => n.isRead).length,
        sample: raw.slice(0, 3).map(n => ({ id: n.id, action: n.action, isRead: n.isRead }))
      });

      // Use server read state as the source of truth
      // The backend already returns isRead from the database
      setNotifications(raw);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    console.log('[markAsRead] Marking notification as read:', id);
    
    // Optimistically update in-memory state first
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      // Persist to backend database
      const response = await api.patch(`/activities/notifications/${id}/read`);
      console.log('[markAsRead] Success:', response.data);
    } catch (error) {
      console.error("[markAsRead] Failed to mark notification as read:", error);
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    }
  }, []);

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
