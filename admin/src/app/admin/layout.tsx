"use client";

import { AdminHeader } from "@/components/admin-header";
import { AdminSidebar } from "@/components/admin-sidebar";
import LoaderState from "@/components/shared/loader-state";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AdminChatWidget } from "@/components/admin-chat-widget";

const ADMIN_TOKEN_KEY = "admin_session_token";
const ADMIN_USER_KEY = "admin_session_user";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const [localUser, setLocalUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Read from localStorage immediately
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      if (raw) setLocalUser(JSON.parse(raw));
    } catch {}
    setChecked(true);
  }, []);

  // Keep localStorage in sync when live session loads
  useEffect(() => {
    if (data?.user) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
      const token = (data as any)?.session?.token;
      if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
      setLocalUser(data.user);
    }
  }, [data?.user]);

  // Prefer live session user, fall back to stored user
  const userData = data?.user ?? localUser;

  useEffect(() => {
    if (!checked) return;
    // Only redirect if we're sure there's no session AND no localStorage user
    if (isPending) return; // still loading — wait
    if (userData) {
      // Has user — check role
      if ((userData as any).role === "GUEST") {
        router.replace("/auth");
      }
      return;
    }
    // No live session and no localStorage user → redirect
    if (!localUser) {
      router.replace("/auth");
    }
  }, [isPending, userData, localUser, checked]);

  // Show loader while checking auth
  if (!checked || (isPending && !localUser)) return <LoaderState />;
  if (!userData) return <LoaderState />;

  return (
    <NotificationProvider>
      <SidebarProvider>
        <AdminSidebar userData={userData as any} />
        <SidebarInset className="rounded-xl overflow-hidden min-w-0">
          <AdminHeader />
          <div className="flex flex-1 flex-col overflow-x-hidden">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      {/* Floating chat widget — visible to BROKER and OWNER only */}
      <AdminChatWidget />
    </NotificationProvider>
  );
};

export default AdminLayout;
