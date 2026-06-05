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
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update unreadCount whenever notifications change
  useEffect(() => {
    const count = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/activities/notifications?limit=50");
      const raw: Notification[] = (res.data?.data || []).filter(
        (n: Notification) => n.description !== "__DELETED__",
      );

      // Load read status from localStorage
      const userId = getCurrentUserId();
      const localRead = loadLocalReadSet(userId);
      
      const data = raw.map((n) => ({
        ...n,
        isRead: localRead.has(n.id),
      }));

      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    console.log('[markAsRead] Before:', { id, currentUnreadCount: notifications.filter(n => !n.isRead).length });
    
    // Update localStorage
    const userId = getCurrentUserId();
    const localRead = loadLocalReadSet(userId);
    localRead.add(id);
    saveLocalReadSet(userId, localRead);

    // Update state immediately
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      const newUnreadCount = updated.filter(n => !n.isRead).length;
      console.log('[markAsRead] After:', { newUnreadCount });
      return updated;
    });
  }, [notifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      // Optimistic remove
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await api.delete(`/activities/notifications/${id}`);
        // Also remove from localStorage
        const userId = getCurrentUserId();
        const localRead = loadLocalReadSet(userId);
        if (localRead.has(id)) {
          localRead.delete(id);
          saveLocalReadSet(userId, localRead);
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
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
