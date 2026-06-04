"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Clock, RefreshCw, X } from "lucide-react";
import { api } from "@/hooks/api";
import { cn } from "@/lib/utils";
import LoaderState from "@/components/shared/loader-state";

const ACTION_LABELS: Record<string, string> = {
  BOOKED: "New Booking",
  APPROVED_BOOKING: "Booking Approved",
  REJECTED_BOOKING: "Booking Rejected",
  CANCELLED_BOOKING: "Booking Cancelled",
  CREATE_GUEST_HOUSE: "New Property",
  REGISTRATION_REQUEST: "New Registration",
};

const ACTION_COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED_BOOKING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED_BOOKING: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED_BOOKING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CREATE_GUEST_HOUSE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REGISTRATION_REQUEST: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/activities/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleCloseDetail = () => {
    setSelectedNotification(null);
  };

  if (loading && notifications.length === 0) return <LoaderState />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-16 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
            </Card>
          ) : (
            notifications.map((notification: any) => {
              const isNew = new Date(notification.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
              const isRead = notification.isRead || !isNew;

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    !isRead && "border-l-4 border-l-primary bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          ACTION_COLORS[notification.action] || "bg-gray-100 text-gray-700"
                        )}>
                          {ACTION_LABELS[notification.action] || notification.action}
                        </span>
                        {!isRead && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-1">{notification.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {!isRead && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    ACTION_COLORS[selectedNotification.action] || "bg-gray-100 text-gray-700"
                  )}>
                    {ACTION_LABELS[selectedNotification.action] || selectedNotification.action}
                  </span>
                  {selectedNotification.isRead && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Read
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseDetail}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-foreground mb-4">{selectedNotification.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Clock className="w-3 h-3" />
                {new Date(selectedNotification.timestamp).toLocaleString()}
              </div>
              <Button onClick={handleCloseDetail} className="w-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
