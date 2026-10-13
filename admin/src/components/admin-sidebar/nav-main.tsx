"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bed,
  Hotel,
  Calendar,
  CreditCard,
  HomeIcon,
  Activity,
  Users2,
  DollarSign,
  Banknote,
  Wallet,
  ChevronRight,
  Palette,
  MessageSquare,
  Bell,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";

// Sidebar links per role
const roleSidebarLinks: Record<
  string,
  Array<{
    title: string;
    url?: string;
    icon: any;
    items?: Array<{ title: string; url: string; icon: any }>;
  }>
> = {
  ADMIN: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Properties", url: "/admin/properties", icon: Hotel },
    { title: "Rooms", url: "/admin/rooms", icon: Bed },
    { title: "Bookings", url: "/admin/bookings", icon: Calendar },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Registrations", url: "/admin/registration-requests", icon: HomeIcon },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "Activities", url: "/admin/activities", icon: Activity },
    { title: "Messages", url: "/admin/messages", icon: MessageSquare },
    { title: "Customization", url: "/admin/customization", icon: Palette },
    {
      title: "Finance",
      icon: DollarSign,
      items: [
        { title: "Payments", url: "/admin/payments", icon: CreditCard },
        { title: "Commissions", url: "/admin/income", icon: Banknote },
      ],
    },
  ],
  OWNER: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "My Property", url: "/admin/properties", icon: Hotel },
    { title: "Bookings", url: "/admin/bookings", icon: Calendar },
    { title: "Rooms", url: "/admin/rooms", icon: Bed },
    { title: "Staffs", url: "/admin/staffs", icon: Users2 },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "Activities", url: "/admin/activities", icon: Activity },
    {
      title: "Finance",
      icon: DollarSign,
      items: [
        { title: "Payments", url: "/admin/payments", icon: CreditCard },
      ],
    },
  ],
  STAFF: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Property", url: "/admin/properties", icon: Hotel },
    { title: "Rooms", url: "/admin/rooms", icon: Bed },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
  ],
  BROKER: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Clients", url: "/admin/clients", icon: Users },
    { title: "Bookings", url: "/admin/bookings", icon: Calendar },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "Activities", url: "/admin/activities", icon: Activity },
    {
      title: "Finance",
      icon: DollarSign,
      items: [
        { title: "Payments", url: "/admin/payments", icon: CreditCard },
      ],
    },
  ],
};

interface NavMainProps {
  role: "ADMIN" | "OWNER" | "STAFF" | "BROKER" | "GUEST";
}

export function NavMain({ role }: NavMainProps) {
  const pathname = usePathname();
  const links = roleSidebarLinks[role] || [];
  const { unreadCount } = useNotifications();

  // Track which collapsible sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Finance: true, // Default open for Finance
  });

  const isActive = (url: string) => pathname === url;

  // Check if any child item is active
  const hasActiveChild = (items?: Array<{ url: string }>) => {
    if (!items) return false;
    return items.some((item) => pathname === item.url);
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="flex flex-col gap-1 px-0">
        <SidebarMenu>
          {links.map((item) => {
            // If item has sub-items (like Finance)
            if (item.items) {
              const isOpen = openSections[item.title];
              const hasActive = hasActiveChild(item.items);

              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleSection(item.title)}
                  className={`group/collapsible `}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`w-full px-4 justify-start ${
                          hasActive
                            ? "bg-[#c9a227]/20 text-[#c9a227]"
                            : "text-white/70 hover:bg-white/10 hover:text-[#c9a227]"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                            hasActive
                              ? "text-[#c9a227]"
                              : "text-white/50"
                          }`}
                        />
                        <span className="font-medium flex-1 text-left">
                          {item.title}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(subItem.url)}
                            >
                              <Link
                                href={subItem.url}
                                className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                                  isActive(subItem.url)
                                    ? "bg-[#c9a227]/20 text-[#c9a227]"
                                    : "text-white/70 hover:bg-white/10 hover:text-[#c9a227]"
                                }`}
                              >
                                <subItem.icon
                                  className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                                    isActive(subItem.url)
                                      ? "text-[#c9a227]"
                                      : "text-white/50"
                                  }`}
                                />
                                <span className="font-medium text-sm">
                                  {subItem.title}
                                </span>
                                {isActive(subItem.url) && (
                                  <motion.span
                                    className="absolute left-0 top-1/2 w-1 h-4 bg-[#c9a227] rounded-r-full"
                                    layoutId="activeIndicator"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: -8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            // Regular menu item without sub-items
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link
                    href={item.url!}
                    className={`w-full relative flex items-center px-4 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                      isActive(item.url!)
                        ? "bg-[#c9a227]/20 text-[#c9a227]"
                        : "text-white/70 hover:bg-white/10 hover:text-[#c9a227]"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 shrink-0 transition-colors duration-200 ${
                        isActive(item.url!)
                          ? "text-[#c9a227]"
                          : "text-white/50"
                      }`}
                    />
                    <span className="font-medium">{item.title}</span>
                    {item.title === "Notifications" && unreadCount > 0 && (
                      <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {isActive(item.url!) && (
                      <motion.span
                        className="absolute left-0 top-1/2 w-1 h-5 bg-[#c9a227] rounded-r-full"
                        layoutId="activeIndicator"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
