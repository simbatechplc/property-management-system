"use client";

import { useTranslation } from "react-i18next";
import { BookingCard } from "./booking-card";
import { useGetUserBookings } from "@/hooks/api/use-bookings";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CheckCircle2, Clock, XCircle, Hotel } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/hooks/api";

export default function BookingsPage() {
  const { t } = useTranslation();
  const dataQuery = useGetUserBookings();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const txRef = searchParams.get("trx_ref") || searchParams.get("tx_ref") || searchParams.get("txRef");
    if (!txRef) return;
    setVerifying(true);
    api.get(`/payments/verify/${txRef}`)
      .then(() => dataQuery.refetch())
      .catch(() => {})
      .finally(() => setVerifying(false));
  }, []);

  const FILTERS = [
    { label: t("bookings.all"), value: "all" },
    { label: t("bookings.pending"), value: "PENDING" },
    { label: t("bookings.approved"), value: "APPROVED" },
    { label: t("bookings.rejected"), value: "REJECTED" },
    { label: t("bookings.cancelled"), value: "CANCELLED" },
  ];

  const allBookings: any[] = dataQuery.data?.data || [];
  const filtered = filter === "all" ? allBookings : allBookings.filter((b) => b.status === filter);

  const stats = {
    total: allBookings.length,
    approved: allBookings.filter((b) => b.status === "APPROVED").length,
    pending: allBookings.filter((b) => b.status === "PENDING").length,
    cancelled: allBookings.filter((b) => b.status === "CANCELLED" || b.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {verifying && (
        <div className="bg-amber-500 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("bookings.verifyingPayment")}
        </div>
      )}

      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("bookings.title")}</h1>
              <p className="text-primary-foreground/70 text-sm">{t("bookings.manageReservations")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { labelKey: "bookings.total", value: stats.total, icon: <Hotel className="w-4 h-4" /> },
              { labelKey: "bookings.approved", value: stats.approved, icon: <CheckCircle2 className="w-4 h-4" /> },
              { labelKey: "bookings.pending", value: stats.pending, icon: <Clock className="w-4 h-4" /> },
              { labelKey: "bookings.cancelled", value: stats.cancelled, icon: <XCircle className="w-4 h-4" /> },
            ].map(({ labelKey, value, icon }) => (
              <div key={labelKey} className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="opacity-70">{icon}</div>
                <div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-primary-foreground/70">{t(labelKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              )}>
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({allBookings.filter((b) => b.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {dataQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : dataQuery.isError || !dataQuery.data?.data ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">{t("bookings.failedToLoad")}</p>
            <Button onClick={() => dataQuery.refetch()} variant="outline" size="sm">{t("bookings.retry")}</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground opacity-40" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {filter === "all" ? t("bookings.noBookingsYet") : t("bookings.noFilterBookings", { filter: filter.toLowerCase() })}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              {filter === "all" ? t("bookings.onceBooked") : t("bookings.tryDifferentFilter")}
            </p>
            {filter === "all" && (
              <Link to="/properties">
                <Button size="sm">{t("cta.browseProperties")}</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
