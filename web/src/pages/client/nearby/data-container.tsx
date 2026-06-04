"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetNearbyProperties } from "@/hooks/api/use-properties";
import LoaderState from "@/components/shared/loader-state";
import { ErrorState } from "@/components/shared/error-state";
import { useSearchParams } from "react-router-dom";
import { PropertyCard } from "@/components/shared/property-card";
import { Spinner } from "@/components/ui/spinner";
import { NearbyEmptyState } from "./empty-view";
import { MapPin, List, Map as MapIcon, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface NearbyContainerProps {
  lat: number;
  lon: number;
  radius?: number;
  page?: number;
  limit?: number;
}

function buildLeafletMap(userLat: number, userLon: number, properties: any[], yourLocationLabel: string): string {
  const markers = properties
    .filter((p: any) => p.location?.latitude && p.location?.longitude)
    .map((p: any) => ({
      lat: parseFloat(p.location.latitude),
      lon: parseFloat(p.location.longitude),
      name: p.name,
      id: p.id,
      distance: p.distance,
    }));

  const markersJs = markers.map(m =>
    `L.marker([${m.lat}, ${m.lon}]).addTo(map).bindPopup('<b>${m.name.replace(/'/g, "\\'")}</b><br>${m.distance ? m.distance + ' km away' : ''}')`
  ).join(";\n");

  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([${userLat}, ${userLon}], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
var userIcon = L.divIcon({html:'<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',iconSize:[14,14],iconAnchor:[7,7],className:''});
L.marker([${userLat}, ${userLon}], {icon: userIcon}).addTo(map).bindPopup('<b>${yourLocationLabel}</b>');
${markersJs};
</script>
</body></html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

const NearbyContainer: React.FC<NearbyContainerProps> = ({ lat, lon, radius = 10, page = 1, limit = 10 }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const currentDistance = searchParams.get("distance") || "10";

  const dataQuery = useGetNearbyProperties({ lat, lon, radius, page, limit, distance: +currentDistance });

  useEffect(() => { dataQuery.refetch(); }, [currentDistance]);

  const properties = dataQuery.data?.data || [];
  const mappable = properties.filter((p: any) => p.location?.latitude && p.location?.longitude);

  if (dataQuery.isLoading) return <LoaderState />;
  if (dataQuery.isError || !dataQuery.data?.data) return <ErrorState title={t("common.error")} refetch={dataQuery.refetch} />;
  if (properties.length === 0) return <div className="h-[70dvh] flex justify-center items-center"><NearbyEmptyState /></div>;

  const mapSrc = buildLeafletMap(lat, lon, mappable, t("nearbyData.yourLocation"));

  return (
    <div>
      {dataQuery.isFetching && (
        <div className="w-full h-full bg-black/10 z-[999] fixed inset-0 backdrop-blur-sm flex justify-center items-center">
          <Spinner scale={2} className="size-12" />
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{properties.length}</span>{" "}
          {t("nearbyData.propertiesWithin", { count: properties.length, distance: currentDistance })}
          {mappable.length > 0 && (
            <span className="ml-2 text-primary">· {t("nearbyData.onMap", { count: mappable.length })}</span>
          )}
        </p>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setView("list")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <List className="w-3.5 h-3.5" /> {t("nearbyData.list")}
          </button>
          <button onClick={() => setView("map")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              view === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <MapIcon className="w-3.5 h-3.5" /> {t("nearbyData.map")}
          </button>
        </div>
      </div>

      {view === "map" && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-border shadow-lg">
          <div className="bg-muted/50 p-3 border-b border-border flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t("nearbyData.propertiesNearYou")}</span>
            <span className="text-xs text-muted-foreground ml-auto">{lat.toFixed(4)}, {lon.toFixed(4)}</span>
          </div>
          <iframe title={t("nearbyData.propertiesNearYou")} className="w-full h-[420px]" src={mapSrc} style={{ border: 0 }} />
          <div className="p-3 bg-background border-t border-border">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mappable.map((p: any) => (
                <a key={p.id} href={`/properties/${p.id}`}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors text-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                  {p.distance && <span className="text-xs text-muted-foreground">{t("nearbyData.kmAway", { km: p.distance })}</span>}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-stretch">
        {properties.map((d: any) => (
          <div key={d.id} className="relative flex flex-col h-full">
            <div className="flex-1">
              <PropertyCard data={d} view="vertical" distance={d.distance} />
            </div>
            {d.location?.latitude && d.location?.longitude && (
              <div className="absolute top-2 left-2 z-10">
                <span className="flex items-center gap-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
                  <MapPin className="w-2.5 h-2.5" /> {t("nearbyData.onMapBadge")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyContainer;
