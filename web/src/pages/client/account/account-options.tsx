"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Lock, Palette, BookOpen } from "lucide-react";
import { AccountSettingsDialog } from "./account-setting-dialog";
import { SecurityDialog } from "./security-dialog";
import { AppearanceDialog } from "./apperence-dialog";

interface AccountOptionsProps {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  };
}

export function AccountOptions({ user }: AccountOptionsProps) {
  const { t } = useTranslation();
  const [openSettings, setOpenSettings] = useState(false);
  const [openSecurity, setOpenSecurity] = useState(false);
  const [openAppearance, setOpenAppearance] = useState(false);

  const handleNavigateBookings = () => {
    window.location.href = "/account/bookings";
  };

  return (
    <>
      <div className="mb-8 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("account.settings")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <Button onClick={() => setOpenSettings(true)} variant="ghost"
              className="h-auto w-full md:flex-col items-center md:items-start justify-start gap-2 p-4 hover:bg-accent">
              <Settings className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">{t("account.accountSettings")}</p>
                <p className="text-sm text-muted-foreground">{t("account.updateProfile")}</p>
              </div>
            </Button>
          </Card>

          <Card className="p-4">
            <Button onClick={handleNavigateBookings} variant="ghost"
              className="h-auto w-full md:flex-col items-center md:items-start justify-start gap-2 p-4 hover:bg-accent">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">{t("account.myBookings")}</p>
                <p className="text-sm text-muted-foreground">{t("account.viewReservations")}</p>
              </div>
            </Button>
          </Card>

          <Card className="p-4">
            <Button onClick={() => setOpenSecurity(true)} variant="ghost"
              className="h-auto w-full md:flex-col items-center md:items-start justify-start gap-2 p-4 hover:bg-accent">
              <Lock className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">{t("account.security")}</p>
                <p className="text-sm text-muted-foreground">{t("account.changePassword")}</p>
              </div>
            </Button>
          </Card>

          <Card className="p-4">
            <Button onClick={() => setOpenAppearance(true)} variant="ghost"
              className="h-auto w-full md:flex-col items-center md:items-start justify-start gap-2 p-4 hover:bg-accent">
              <Palette className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">{t("account.appearance")}</p>
                <p className="text-sm text-muted-foreground">{t("account.customizePrefs")}</p>
              </div>
            </Button>
          </Card>
        </div>
      </div>

      <AccountSettingsDialog open={openSettings} onOpenChange={setOpenSettings} user={user} />
      <SecurityDialog open={openSecurity} onOpenChange={setOpenSecurity} />
      <AppearanceDialog open={openAppearance} onOpenChange={setOpenAppearance} />
    </>
  );
}
