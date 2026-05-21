"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ModeToggle } from "../ui/mode-toggle";
import { api } from "@/hooks/api";
import { cn } from "@/lib/utils";

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

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/activities/notifications?limit=15");
      setNotifications(res.data?.data || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    // Update unread count
    const n = notifications.find(n => n.id === id);
    if (n) {
      const isNew = new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (isNew) setUnreadCount(c => Math.max(0, c - 1));
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-white/70 hover:text-[#c9a227] hover:bg-white/10"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{unreadCount} new</span>
              {dismissed.size > 0 && (
                <button
                  onClick={() => setDismissed(new Set())}
                  className="text-xs text-primary hover:underline"
                >
                  Restore all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : visibleNotifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              visibleNotifications.map((n: any) => {
                const isNew = new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                return (
                  <div key={n.id} className={cn("px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors", isNew && "bg-primary/5")}>
                    <div className="flex items-start gap-2">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5", ACTION_COLORS[n.action] || "bg-gray-100 text-gray-700")}>
                        {ACTION_LABELS[n.action] || n.action}
                      </span>
                      {isNew && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">New</span>}
                      <div className="ml-auto flex items-center gap-1 shrink-0">
                        <button
                          title="View full details"
                          onClick={() => {
                            const detail = `${ACTION_LABELS[n.action] || n.action}\n\n${n.description}\n\nTime: ${new Date(n.timestamp).toLocaleString()}`;
                            alert(detail);
                          }}
                          className="w-5 h-5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-[10px] font-bold"
                        >
                          i
                        </button>
                        <button
                          title="Dismiss notification"
                          onClick={() => handleDismiss(n.id)}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.timestamp).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const data = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    description: "Overview of the admin panel and key metrics",
    backButton: false,
  },
  {
    title: "Properties",
    path: "/admin/properties",
    description: "Manage all properties registered in the system",
    backButton: false,
  },
  {
    title: "Create Property",
    path: "/admin/properties/create",
    description: "Add a new property to the system",
    backButton: true,
  },
  {
    title: "Rooms",
    path: "/admin/rooms",
    description: "Manage rooms available in each property",
    backButton: false,
  },
  {
    title: "Create Room",
    path: "/admin/rooms/create",
    description: "Add a new room to a property",
    backButton: true,
  },
  {
    title: "Bookings",
    path: "/admin/bookings",
    description: "View and manage all bookings",
    backButton: false,
  },
  {
    title: "Manual Bookings",
    path: "/admin/bookings/manual-booking",
    description: "Book manually",
    backButton: true,
  },
  {
    title: "Users",
    path: "/admin/users",
    description: "Manage system users and their roles",
    backButton: false
  },
  {
    title: "Clients",
    path: "/admin/clients",
    description: "View and contact your clients",
    backButton: false,
  },
  {
    title: "Registrations",
    path: "/admin/registration-requests",
    description: "Approve or reject new registration requests",
    backButton: false,
  },
  {
    title: "Activities",
    path: "/admin/activities",
    description: "Track recent user activities in the system",
    backButton: false,
  },
  {
    title: "Commissions",
    path: "/admin/income",
    description: "View platform and broker commission settings",
    backButton: false,
  },
  {
    title: "Payments",
    path: "/admin/payments",
    description: "View and manage payments made by users",
    backButton: false,
  },
  {
    title: "Sub Accounts",
    path: "/admin/subaccounts",
    description: "Manage sub-accounts linked to main accounts",
    backButton: false,
  },
  {
    title: "Settings",
    path: "/admin/settings",
    description: "System-wide configuration and settings",
    backButton: false,
  },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const currentItem = data.find((item) => pathname.startsWith(item.path)) || {
    title: "Admin Panel",
    description: "",
    backButton: false
  };

  const [headerItem, setHeaderItem] = useState(currentItem);

  useEffect(() => {
    const current = data.find((item) => pathname.startsWith(item.path)) || {
      title: "Admin Panel",
      description: "",
      backButton: false
    };
    setHeaderItem(current);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1a4a2e] border-b border-white/10 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="ml-[-4px] text-white/70 hover:text-[#c9a227] hover:bg-white/10" />
          <Separator orientation="vertical" className="h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            {headerItem.backButton && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-white/70 hover:text-[#c9a227] hover:bg-white/10"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-[#c9a227]">{headerItem.title}</h1>
              {headerItem.description && (
                <p className="text-sm text-white/50">
                  {headerItem.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
