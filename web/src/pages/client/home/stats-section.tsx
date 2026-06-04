"use client"

import { useTranslation } from "react-i18next";
import { Users, Home, Star, MapPin, Shield, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/hooks/api"

export function PropertyStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalProperties: 0, totalBookings: 0, totalReviews: 0, cities: 0 });

  useEffect(() => {
    api.get("/public/stats").then(res => {
      const d = res.data;
      setStats({ totalProperties: d.totalProperties || 0, totalBookings: d.totalBookings || 0, totalReviews: d.totalReviews || 0, cities: 7 });
    }).catch(() => {
      api.get("/properties?limit=1").then(r => {
        setStats(s => ({ ...s, totalProperties: r.data?.pagination?.totalItems || 0 }));
      }).catch(() => {});
    });
  }, []);

  const cards = [
    { icon: <Home className="w-6 h-6" />, labelKey: "statsSection.properties", value: stats.totalProperties, suffix: "+", descKey: "statsSection.handpicked", color: "from-purple-500 to-pink-500" },
    { icon: <Users className="w-6 h-6" />, labelKey: "statsSection.bookingsMade", value: stats.totalBookings, suffix: "+", descKey: "statsSection.trustedTravelers", color: "from-blue-500 to-cyan-500" },
    { icon: <Star className="w-6 h-6" />, labelKey: "statsSection.reviews", value: stats.totalReviews, suffix: "+", descKey: "statsSection.guestExperiences", color: "from-amber-500 to-orange-500" },
    { icon: <MapPin className="w-6 h-6" />, labelKey: "statsSection.cities", value: stats.cities, suffix: "+", descKey: "statsSection.acrossEthiopia", color: "from-emerald-500 to-teal-500" },
    { icon: <Shield className="w-6 h-6" />, labelKey: "statsSection.secureBookings", value: 100, suffix: "%", descKey: "statsSection.safeVerified", color: "from-red-500 to-rose-500" },
    { icon: <Zap className="w-6 h-6" />, labelKey: "statsSection.instantBooking", value: 24, suffix: "/7", descKey: "statsSection.bookAnytime", color: "from-indigo-500 to-blue-500" },
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t("statsSection.title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">{t("statsSection.subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">{t(s.labelKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(s.descKey)}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${s.color} text-white shadow-md shrink-0`}>{s.icon}</div>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold">{s.value.toLocaleString()}</span>
                {s.suffix && <span className="text-base text-muted-foreground font-semibold">{s.suffix}</span>}
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${s.color} rounded-full w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
