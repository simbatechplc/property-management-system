"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import LoaderState from "@/components/shared/loader-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell, BellRing, RefreshCw, Trash2, ChevronRight,
  Calendar, Building2, CreditCard, UserCheck, X, Clock,
  AlertTriangle, CheckCircle2, XCircle, Info, FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  BOOKED: { label: "New Booking", icon: <Calendar className="w-4 h-4" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  APPROVED_BOOKING: { label: "Booking Approved", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  REJECTED_BOOKING: { label: "Booking Rejected", icon: <XCircle className="w-4 h-4" />, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  CANCELLED_BOOKING: { label: "Booking Cancelled", icon: <AlertTriangle className="w-4 h-4" />, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  CREATE_GUEST_HOUSE: { label: "New Property", icon: <Building2 className="w-4 h-4" />, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  REGISTRATION_REQUEST: { label: "New Registration", icon: <UserCheck className="w-4 h-4" />, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  PAYMENT_SUCCESS: { label: "Payment Received", icon: <CreditCard className="w-4 h-4" />, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  PAYMENT_FAILED: { label: "Payment Failed", icon: <CreditCard className="w-4 h-4" />, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  REPORT_SUBMITTED: { label: "Report Submitted", icon: <FileText className="w-4 h-4" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  DEFAULT: { label: "Notification", icon: <Info className="w-4 h-4" />, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900/30" },
};

function getConfig(action: string) {
  return ACTION_CONFIG[action] || ACTION_CONFIG.DEFAULT;
}

type Tab = "all" | "unread" | "read";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, deleteNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const selectedNotification = notifications.find(n => n.id === selectedId);

  const filtered = notifications.filter(n => {
    if (activeTab === "unread") return !n.isRead;
    if (activeTab === "read") return Boolean(n.isRead);
    return true;
  });

  const handleNotificationClick = (notification: any) => {
    setSelectedId(notification.id);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingIds(prev => new Set([...prev, id]));
    if (selectedId === id) setSelectedId(null);
    await deleteNotification(id);
    setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: notifications.filter(n => n.isRead).length },
  ];

  if (loading && notifications.length === 0) return <LoaderState />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BellRing className="w-6 h-6 text-primary" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-2 self-start sm:self-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedId(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "min-w-[1.25rem] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                  activeTab === tab.key
                    ? tab.key === "unread" ? "bg-red-500 text-white" : "bg-primary/20 text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={cn("grid gap-6", selectedNotification ? "grid-cols-1 lg:grid-cols-[1fr_380px]" : "grid-cols-1")}>
          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground opacity-40" />
                </div>
                <p className="font-semibold mb-1">
                  {activeTab === "read" ? "No read notifications" : activeTab === "unread" ? "You're all caught up!" : "No notifications yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "unread" ? "All notifications have been read." : "Notifications will appear here."}
                </p>
              </div>
            ) : (
              filtered.map((notification: any) => {
                const config = getConfig(notification.action);
                const isSelected = selectedId === notification.id;
                const isDeleting = deletingIds.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200",
                      "hover:shadow-md hover:-translate-y-0.5",
                      isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30",
                      !notification.isRead && !isSelected && "border-l-4 border-l-primary",
                      isDeleting && "opacity-40 pointer-events-none scale-95"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                      <span className={config.color}>{config.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", config.bg, config.color)}>
                            {config.label}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 mb-2">{notification.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(notification.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        {notification.isRead && <span className="text-emerald-600 dark:text-emerald-400 font-medium">· Read</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail Panel */}
          {selectedNotification && (
            <div className="sticky top-6 h-fit">
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border", getConfig(selectedNotification.action).bg)}>
                  <div className="flex items-center gap-2">
                    <span className={getConfig(selectedNotification.action).color}>{getConfig(selectedNotification.action).icon}</span>
                    <span className={cn("text-sm font-semibold", getConfig(selectedNotification.action).color)}>
                      {getConfig(selectedNotification.action).label}
                    </span>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedNotification.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                      <p className="text-xs font-medium">{format(new Date(selectedNotification.timestamp), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(selectedNotification.timestamp), "h:mm a")}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", selectedNotification.isRead ? "bg-emerald-500" : "bg-red-500")} />
                        <p className="text-xs font-medium">{selectedNotification.isRead ? "Read" : "Unread"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Received</p>
                    <p className="text-sm font-medium">{formatDistanceToNow(new Date(selectedNotification.timestamp), { addSuffix: true })}</p>
                  </div>

                  <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => handleDelete(selectedNotification.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Notification
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
