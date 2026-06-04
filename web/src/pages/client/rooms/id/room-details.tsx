import { useTranslation } from "react-i18next";
import { Users, Maximize2, Wifi, Wind, Tv, Droplet, BedDouble, Bath, Coffee, Car, Utensils, Dumbbell, CheckCircle2, XCircle, Calendar, AlertCircle } from "lucide-react";
import FormatedAmount from "@/components/shared/formatted-amount";
import RoomFeatures from "./room-features";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Feature { id: string; name: string; category: string | null; value: string | null; }
interface BookedRange { checkIn: string | Date; checkOut: string | Date; }
interface Room {
  name: string; description: string | null; type: string;
  squareMeters: number; maxOccupancy: number; features: Feature[];
  price: any; availability: boolean; bookings?: BookedRange[];
}

const featureIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />, climate: <Wind className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />, bathroom: <Droplet className="w-4 h-4" />,
  bedroom: <BedDouble className="w-4 h-4" />, kitchen: <Utensils className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />, gym: <Dumbbell className="w-4 h-4" />,
  breakfast: <Coffee className="w-4 h-4" />,
};

export default function RoomDetails({ room }: { room: Room }) {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeBookings = (room.bookings || []).filter(
    (b) => b.checkIn && b.checkOut && new Date(b.checkOut) >= today
  );
  const latestCheckout = activeBookings.reduce<Date | null>((latest, b) => {
    const co = new Date(b.checkOut);
    return !latest || co > latest ? co : latest;
  }, null);
  const nextAvailableDate = latestCheckout ? addDays(latestCheckout, 1) : null;
  const bookedRangesDisplay = activeBookings.map((b) => ({
    from: format(new Date(b.checkIn), "MMM d"),
    to: format(new Date(b.checkOut), "MMM d, yyyy"),
  }));

  // Group features by category
  const featuresByCategory = (room.features || []).reduce<Record<string, Feature[]>>((acc, f) => {
    const cat = f.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Room header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs uppercase tracking-wide font-semibold">{room.type}</Badge>
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            room.availability
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", room.availability ? "bg-green-500" : "bg-red-500")} />
            {room.availability ? t("room.availableNow") : t("room.currentlyUnavailable")}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{room.name}</h1>

        <div className="flex items-baseline gap-1.5 mb-4">
          {(() => {
            const rd = (room as any).discountPercent ?? 0;
            const pd = (room as any).property?.discountPercent ?? 0;
            const afterProp = pd > 0 ? room.price * (1 - pd / 100) : room.price;
            const effective = rd > 0 ? afterProp * (1 - rd / 100) : afterProp;
            const effectiveRounded = Math.round(effective * 100) / 100;
            const hasDiscount = effectiveRounded < room.price;
            const totalPct = pd + rd - (pd * rd / 100);
            return hasDiscount ? (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm line-through text-muted-foreground">ETB {room.price.toLocaleString()}{t("room.night")}</p>
                  <div className="flex items-baseline gap-1.5">
                    <FormatedAmount amount={effectiveRounded} className="text-2xl font-bold text-red-500" />
                    <span className="text-sm text-muted-foreground">{t("room.night")}</span>
                  </div>
                </div>
                <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full">
                  🏷️ {Math.round(totalPct)}% OFF
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <FormatedAmount amount={room.price} className="text-2xl font-bold text-primary" />
                <span className="text-sm text-muted-foreground">{t("room.night")}</span>
              </div>
            );
          })()}
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Maximize2 className="w-4 h-4 text-primary" />, label: t("room.roomSize"), value: `${room.squareMeters} sqm` },
            { icon: <Users className="w-4 h-4 text-primary" />, label: t("room.maxGuests"), value: `${room.maxOccupancy}` },
            { icon: <BedDouble className="w-4 h-4 text-primary" />, label: t("room.roomType"), value: room.type },
            { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: t("room.cancellation"), value: t("room.free") },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
              <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Availability status */}
      {!room.availability && bookedRangesDisplay.length > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t("room.bookedDates")}</p>
          </div>
          <div className="space-y-1.5">
            {bookedRangesDisplay.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-600 dark:text-red-400">{r.from} – {r.to}</span>
              </div>
            ))}
          </div>
          {nextAvailableDate && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {t("room.availableFrom", { date: format(nextAvailableDate, "MMM d, yyyy") })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* About */}
      {room.description && (
        <div className="rounded-2xl bg-muted/30 border border-border p-5">
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            {t("room.aboutThisRoom")}
          </h2>
          <p className="leading-relaxed text-muted-foreground text-sm">{room.description}</p>
        </div>
      )}

      {/* Features by category */}
      {Object.keys(featuresByCategory).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            {t("room.roomFeatures")}
          </h2>
          <div className="space-y-4">
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">{category}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        {featureIcons[category] || <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{f.name}</p>
                        {f.value && f.value !== "true" && (
                          <p className="text-xs text-muted-foreground truncate">{f.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 bg-muted/30 border-b border-border">
          <h2 className="text-sm font-semibold">{t("room.roomPolicies")}</h2>
        </div>
        {[
          { label: t("room.checkInPolicy"), value: t("room.checkInTime") },
          { label: t("room.checkOutPolicy"), value: t("room.checkOutTime") },
          { label: t("room.cancellation"), value: t("room.freeCancellation"), green: true },
          { label: t("room.smoking"), value: t("room.smokingNotAllowed") },
          { label: t("room.pets"), value: t("room.petsNotAllowed") },
        ].map(({ label, value, green }: any, i, arr) => (
          <div key={label} className={cn("flex justify-between items-center px-5 py-3 text-sm", i < arr.length - 1 ? "border-b border-border/50" : "")}>
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("font-medium", green && "text-green-600 dark:text-green-400")}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
