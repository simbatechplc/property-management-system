import { useTranslation } from "react-i18next";
import { FilterSidebar } from "@/components/shared/filter/filter-sidebar";
import { PaginationControls } from "@/components/shared/pagination";
import { PropertyCard } from "@/components/shared/property-card";
import type { PropertyDataResponse } from "@/hooks/api/use-properties";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

interface Props {
  data: PropertyDataResponse[];
  pagination: {
    currentPage: number; totalPages: number; totalItems: number;
    limit: number; hasMore: boolean; previousPage: number | null; nextPage: number | null;
  };
  locationParam?: string;
  totalItems?: number;
}

const DataContainer = ({ data, pagination, locationParam = "", totalItems = 0 }: Props) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSort = searchParams.get("sortField") || "top_picks";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const SORT_TABS = [
    { labelKey: "propertiesData.topPicks", sortField: "top_picks", sortDirection: "desc", icon: "⭐" },
    { labelKey: "propertiesData.lowestPrice", sortField: "price", sortDirection: "asc", icon: "💰" },
    { labelKey: "propertiesData.nearest", sortField: "nearest", sortDirection: "asc", icon: "📍" },
    { labelKey: "propertiesData.bestReviewed", sortField: "rating", sortDirection: "desc", icon: "🏆" },
  ];

  const safeData = Array.isArray(data) ? data : [];
  const avgPrice = (d: PropertyDataResponse) => {
    const prices = (d.rooms || []).map((r: any) => r.price).filter((p: number) => p > 0);
    return prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : null;
  };
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const priceFiltered = (minPrice !== null || maxPrice !== null)
    ? safeData.filter(d => {
        const avg = avgPrice(d);
        if (avg === null) return false;
        if (minPrice !== null && avg < minPrice) return false;
        if (maxPrice !== null && avg > maxPrice) return false;
        return true;
      })
    : safeData;

  const sortedData = [...priceFiltered].sort((a, b) => {
    if (activeSort === "price") {
      return (avgPrice(a) ?? Infinity) - (avgPrice(b) ?? Infinity);
    }
    if (activeSort === "nearest") {
      const refLat = 9.0; const refLon = 38.7;
      const dist = (d: PropertyDataResponse) => {
        const lat = parseFloat((d as any).location?.latitude);
        const lon = parseFloat((d as any).location?.longitude);
        if (isNaN(lat) || isNaN(lon)) return Infinity;
        return Math.sqrt((lat - refLat) ** 2 + (lon - refLon) ** 2);
      };
      const da = dist(a); const db = dist(b);
      if (da === Infinity && db === Infinity) return ((a as any).location?.city || "").localeCompare((b as any).location?.city || "");
      return da - db;
    }
    return 0;
  });

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", newPage.toString());
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleRowsPerPageChange = (value: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("limit", value.toString());
    p.set("page", "1");
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleSort = (sortField: string, sortDirection: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("sortField", sortField);
    p.set("sortDirection", sortDirection);
    p.delete("page");
    setSearchParams(p);
  };

  const typeParam = searchParams.get("type");
  const typeLabels: Record<string, string> = {
    HOTEL: t("propertyTypes.hotels"),
    GUEST_HOUSE: t("propertyTypes.guestHouses"),
    APARTMENT: t("propertyTypes.apartments"),
    RESORT: t("propertyTypes.resorts"),
    VILLA: t("propertyTypes.villas"),
    HOSTEL: t("propertyTypes.hostels"),
  };

  const heading = typeParam && typeLabels[typeParam]
    ? typeLabels[typeParam]
    : locationParam
    ? t("propertiesData.propertiesIn", { location: locationParam })
    : t("propertiesData.allProperties");

  const subheading = locationParam
    ? t("propertiesData.propertiesFoundIn", { count: totalItems || safeData.length, location: locationParam })
    : t("propertiesData.propertiesFound", { count: totalItems || safeData.length });

  return (
    <div className="flex flex-col lg:flex-row gap-6 isolate">
      <FilterSidebar />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{heading}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>
          </div>
          <div className="flex items-center gap-2">
            {totalItems > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {totalItems} {t("propertiesData.available")}
              </div>
            )}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")}
                className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
                title={t("propertiesData.gridView")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={cn("p-2 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
                title={t("propertiesData.listView")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {locationParam && (
          <div className="flex gap-4 mb-6">
            <div className="flex-1 border border-border rounded-xl p-4 text-sm">
              <p className="font-bold mb-2">{t("propertiesData.quickFacts", { location: locationParam })}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{t("propertiesData.quickFactsDesc", { location: locationParam })}</p>
            </div>
            <div className="flex-1 border border-border rounded-xl p-4 text-sm">
              <p className="font-bold mb-2">{t("propertiesData.keyPoints")}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                <li>{t("propertiesData.keyPoint1")}</li>
                <li>{t("propertiesData.keyPoint2")}</li>
                <li>{t("propertiesData.keyPoint3")}</li>
                <li>{t("propertiesData.keyPoint4")}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {SORT_TABS.map((tab) => (
            <button key={tab.sortField} onClick={() => handleSort(tab.sortField, tab.sortDirection)}
              className={cn("px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all border shrink-0 flex items-center gap-1.5",
                activeSort === tab.sortField
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground border-border hover:text-foreground hover:border-primary/50 hover:bg-muted/50")}>
              <span>{tab.icon}</span>{t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-4")}>
          {sortedData.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              </svg>
              <p className="text-lg font-medium">{t("propertiesData.noPropertiesFound")}</p>
              <p className="text-sm mt-1">{t("propertiesData.noPropertiesTryFilter")}</p>
            </div>
          ) : (
            sortedData.map((d, idx) => (
              <PropertyCard data={d} key={d.id + idx} view={viewMode === "grid" ? "vertical" : "horizontal"} />
            ))
          )}
        </div>

        <PaginationControls
          onLimitChange={handleRowsPerPageChange}
          onPageChange={handlePageChange}
          pagination={{ ...pagination, limit: Number(pagination.limit) || Number(searchParams.get("limit")) || 10 }}
          className="py-10 mt-8"
          showLimitSelector
        />
      </div>
    </div>
  );
};

export default DataContainer;
