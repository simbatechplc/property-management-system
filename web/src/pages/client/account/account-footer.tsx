"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClientAuth } from "@/hooks/use-client-auth";
import { LogOut } from "lucide-react";

export function AccountFooter() {
  const { t } = useTranslation();
  const { signOut } = useClientAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <Card className="border-t border-border bg-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          {t("accountFooter.logout")}
        </Button>
      </div>
    </Card>
  );
}
