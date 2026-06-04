"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import NearbyContainer from "./data-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { DistanceSelect } from "./distance-select";

const NearbyPage = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(t("nearby.locationNeeded"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => { console.error(err); setError(t("nearby.locationNeeded")); }
    );
  }, [t]);

  return (
    <main className="mt-6 md:mt-16 px-4 sm:px-14 md:px-24">
      <div className="flex sm:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{t("nearby.title")}</h1>
        <DistanceSelect />
      </div>

      {error && (
        <div className="py-32 w-full flex justify-center items-center">
          <EmptyState
            title={t("nearby.locationNeeded")}
            description={t("nearby.locationDescription")}
          />
        </div>
      )}

      {!location && !error && (
        <div className="w-full h-full bg-black/10 z-[999] fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm flex justify-center items-center">
          <Spinner scale={2} className="size-12" />
        </div>
      )}

      {location && <NearbyContainer lat={location.lat} lon={location.lon} radius={10} />}
    </main>
  );
};

export default NearbyPage;
