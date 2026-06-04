"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "../ui/mode-toggle";
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
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
