"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle2, Clock, RefreshCw, X, Trash } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
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
  APPROVED_BOOKING:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED_BOOKING:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED_BOOKING:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CREATE_GUEST_HOUSE:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REGISTRATION_REQUEST:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null,
  );

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setActiveTab("read");
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    } else {
      // If already read, still show details but switch to read tab for consistency
      setActiveTab("read");
    }
  };

  const handleCloseDetail = () => {
    setSelectedNotification(null);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") {
      return !notification.isRead;
    }
    if (activeTab === "read") {
      return Boolean(notification.isRead);
    }
    return true;
  });

  if (loading && notifications.length === 0) return <LoaderState />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "all" | "unread" | "read")
          }
          className="mb-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 rounded-full bg-muted p-1 text-sm">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
              Unread
            </TabsTrigger>
            <TabsTrigger
              value="read"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
              Read
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-16 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">
                {activeTab === "read"
                  ? "No read notifications"
                  : activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "read"
                  ? "You have not opened any notifications yet."
                  : activeTab === "unread"
                    ? "You’re all caught up."
                    : "Notifications will appear here as they arrive."}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification: any) => {
              const isRead = Boolean(notification.isRead);

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    "group overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    !isRead && "border-primary/30 bg-primary/5",
                  )}
                  onClick={() => handleNotificationClick(notification)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            ACTION_COLORS[notification.action] ||
                              "bg-gray-100 text-gray-700",
                          )}>
                          {ACTION_LABELS[notification.action] ||
                            notification.action}
                        </span>
                        {!isRead && (
                          <Badge
                            variant="secondary"
                            className="text-xs uppercase">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-1">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs uppercase">
                          {isRead ? "Read" : "New"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotification(notification);
                            if (!isRead) handleMarkAsRead(notification.id);
                          }}
                          className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteNotification(notification.id);
                            if (selectedNotification?.id === notification.id) {
                              setSelectedNotification(null);
                            }
                          }}
                          className="h-8 w-8 text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedNotification?.id === notification.id && (
                    <div className="mt-4 rounded-lg border-t pt-4">
                      <p className="text-sm text-foreground mb-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedNotification(null)}>
                            Close
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              await deleteNotification(notification.id);
                              setSelectedNotification(null);
                            }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
