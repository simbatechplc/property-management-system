"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetProperties } from "@/hooks/api/use-properties";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import DataContainer from "./data-container";
import { Search, Users, CalendarDays, MapPin, ChevronDown, Plus, Minus } from "lucide-react";
import type { PropertyFilters } from "@/types/property.types";
import { PropertyFilter } from "@/components/shared/filter";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const CITY_IMAGES: Record<string, string> = {
  "Addis Ababa": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/2b/7d/7c/caption.jpg?w=1200&h=-1&s=1",
  "Bahir Dar":   "https://tuckmagazine.com/wp-content/uploads/2018/12/addis.jpg",
  "Hawassa":     "https://imgix.brilliant-ethiopia.com/lake-awasa-2.jpg?auto=format,enhance,compress&fit=crop&w=1600&h=600&q=60",
  "Gondar":      "https://imgix.brilliant-ethiopia.com/fasil-ghebbi-royal-enclosure-gondar.jpg?auto=format,enhance,compress&fit=crop&crop=entropy,faces,focalpoint&w=1880&h=740&q=30",
};
const DEFAULT_HERO = "https://images.unsplash.com/photo-1561501900-3701fa6a0864?ixlib=rb-4.1.0&fm=jpg&q=60&w=3000";

const SUGGESTIONS = [
  { label: "Addis Ababa", sub: "Ethiopia", type: "City", popular: true },
  { label: "Bole", sub: "Addis Ababa, Ethiopia", type: "Area" },
  { label: "Yeka", sub: "Addis Ababa, Ethiopia", type: "Area" },
  { label: "Kirkos", sub: "Addis Ababa, Ethiopia", type: "Area" },
  { label: "Bahir Dar", sub: "Ethiopia", type: "City", popular: true },
  { label: "Hawassa", sub: "Ethiopia", type: "City", popular: true },
  { label: "Gondar", sub: "Ethiopia", type: "City", popular: true },
  { label: "Adama", sub: "Ethiopia", type: "City" },
  { label: "Dire Dawa", sub: "Ethiopia", type: "City" },
  { label: "Mekelle", sub: "Ethiopia", type: "City" },
];

function SearchBar({ location, onSearch }: { location: string; onSearch: (q: string, checkIn?: Date, checkOut?: Date, adults?: number) => void }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(location);
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);
  const [propSuggestions, setPropSuggestions] = useState<{ label: string; sub: string; type: string; popular?: boolean }[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(location), [location]);

  // Fetch property name suggestions when user types
  useEffect(() => {
    if (!q.trim() || q.length < 2) { setPropSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { api } = await import("@/hooks/api");
        const res = await api.get("/properties", { params: { search: q, limit: 5 } });
        const props = res.data?.data || [];
        setPropSuggestions(props.map((p: any) => ({ label: p.name, sub: p.address || p.location?.city || "", type: "Property" })));
      } catch { setPropSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const staticFiltered = q.trim()
    ? SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q.toLowerCase()) || s.sub.toLowerCase().includes(q.toLowerCase()))
    : SUGGESTIONS.slice(0, 4);

  const filtered = [...propSuggestions, ...staticFiltered].slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setGuestOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Mobile: simple search input */}
      <div className="flex md:hidden w-full bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 min-w-0">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoComplete="off"
            className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
            placeholder={t("search.destinationPlaceholderMobile")}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter") { onSearch(q, checkIn, checkOut, adults); setOpen(false); } }}
          />
        </div>
        <button
          onClick={() => { onSearch(q, checkIn, checkOut, adults); setOpen(false); }}
          className="bg-primary hover:bg-primary/90 text-white px-5 text-sm font-bold transition-colors shrink-0"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop: full search bar */}
      <div className="hidden md:flex w-full bg-white rounded-lg shadow-2xl border border-gray-100">
        {/* Destination */}
        <div className="flex-1 flex items-center gap-3 px-5 py-4 border-r border-gray-200 min-w-0">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            autoComplete="off"
            className="flex-1 text-base text-gray-900 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
            placeholder={t("search.destinationPlaceholder")}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setGuestOpen(false); }}
            onFocus={() => { setOpen(true); setGuestOpen(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onSearch(q, checkIn, checkOut, adults); setOpen(false); } if (e.key === "Escape") setOpen(false); }}
          />
        </div>

        {/* Check-in */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-4 border-r border-gray-200 hover:bg-gray-50 transition-colors shrink-0" onClick={() => setOpen(false)}>
              <CalendarDays className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-xs text-gray-400">{t("search.checkIn")}</p>
                <p className="text-sm text-gray-700 font-medium">{checkIn ? format(checkIn, "d MMM") : t("search.addDate")}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[99999]" align="start">
            <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
          </PopoverContent>
        </Popover>

        {/* Check-out */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-4 border-r border-gray-200 hover:bg-gray-50 transition-colors shrink-0" onClick={() => setOpen(false)}>
              <CalendarDays className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-xs text-gray-400">{t("search.checkOut")}</p>
                <p className="text-sm text-gray-700 font-medium">{checkOut ? format(checkOut, "d MMM") : t("search.addDate")}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[99999]" align="start">
            <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus disabled={checkIn ? { before: checkIn } : undefined} />
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-5 py-4 border-r border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
            onClick={() => { setGuestOpen(g => !g); setOpen(false); }}
          >
            <Users className="w-5 h-5 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-400">{t("search.guests")}</p>
              <p className="text-sm text-gray-700 font-medium">{t("search.adult", { count: adults })} · {t("search.room", { count: rooms })}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {guestOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-64 z-[99999]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">{t("search.adults")}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAdults(a => Math.max(1, a - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-4 text-center">{adults}</span>
                  <button onClick={() => setAdults(a => a + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t("search.rooms")}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRooms(r => Math.max(1, r - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-4 text-center">{rooms}</span>
                  <button onClick={() => setRooms(r => r + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <Button className="w-full mt-4" size="sm" onClick={() => setGuestOpen(false)}>{t("search.done")}</Button>
            </div>
          )}
        </div>

        <button
          onClick={() => { onSearch(q, checkIn, checkOut, adults); setOpen(false); setGuestOpen(false); }}
          className="bg-primary hover:bg-primary/90 text-white px-10 text-base font-bold transition-colors shrink-0 rounded-r-lg"
        >
          {t("search.search")}
        </button>
      </div>{/* end desktop */}

      {/* Suggestions dropdown */}
      {open && (filtered.length > 0 || (q.length >= 2)) && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 99999 }}>
          {q.trim() && (
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white hover:bg-primary/90 transition-colors text-left"
              onMouseDown={(e) => { e.preventDefault(); onSearch(q, checkIn, checkOut, adults); setOpen(false); }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{q}</p>
                <p className="text-xs text-white/70">{t("search.searchFor")}</p>
              </div>
            </button>
          )}
          {filtered.map((s, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
              onMouseDown={(e) => { e.preventDefault(); setQ(s.label); onSearch(s.label, checkIn, checkOut, adults); setOpen(false); }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                {s.popular ? <span className="text-yellow-500 text-base">★</span> : <MapPin className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: q.trim()
                      ? s.label.replace(new RegExp(`(${escape(q)})`, "gi"), "<strong>$1</strong>")
                      : s.label
                  }}
                />
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 mr-2">{s.type}</span>
              {s.popular && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium shrink-0">{t("search.popular")}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const locationParam = searchParams.get("location") || "";
  const limitSearchParam = searchParams.get("limit");
  const pageSearchParam = searchParams.get("page");
  const filters: any = {};
  const SKIP_KEYS = new Set(["limit", "page", "sort", "sortField", "sortDirection"]);

  searchParams.forEach((value, key) => {
    if (SKIP_KEYS.has(key)) return;
    if (key === "facilityNames") {
      try { filters[key as keyof PropertyFilters] = JSON.parse(value); } catch { filters[key as any] = value; }
    } else if (["minRating","maxRating","minPrice","maxPrice"].includes(key)) {
      filters[key] = Number(value);
    } else if (key === "hasRoomsAvailable") {
      filters[key] = value === "true";
    } else {
      filters[key as any] = value;
    }
  });

  const sort = searchParams.get("sort");
  const sortField = searchParams.get("sortField");

  const hasActiveFilters = useMemo(() => {
    return Array.from(searchParams.keys()).some((k) => k !== "sort");
  }, [searchParams]);

  const dataQuery = useGetProperties({
    filters,
    limit: Number(limitSearchParam) || 10,
    page: Number(pageSearchParam) || 1,
    sortDirection: sort === "latest" ? "desc" : "asc",
    sortField: sortField || undefined,
    retry: false,
  } as any);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting), { threshold: 0 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  const handleSearch = (q: string, checkIn?: Date, checkOut?: Date, adults?: number) => {
    const p = new URLSearchParams(searchParams);
    p.delete("search"); p.delete("location"); p.delete("city"); p.delete("subcity");
    if (q) {
      if (q.includes(", ")) {
        const parts = q.split(", ");
        p.set("subcity", parts[0].trim());
        p.set("city", parts[1].trim());
      } else {
        p.set("search", q);
      }
    }
    if (checkIn) p.set("checkIn", checkIn.toISOString()); else p.delete("checkIn");
    if (checkOut) p.set("checkOut", checkOut.toISOString()); else p.delete("checkOut");
    if (adults && adults > 1) p.set("guests", String(adults)); else p.delete("guests");
    setSearchParams(p);
  };

  const heroImage = CITY_IMAGES[locationParam] || DEFAULT_HERO;

  const renderData = () => {
    if (dataQuery.isLoading) {
      return (
        <div className="flex gap-6 mt-6">
          <Skeleton className="w-[260px] h-[80vh] max-lg:hidden rounded-xl shrink-0" />
          <div className="flex flex-col gap-4 flex-1">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[240px] w-full rounded-xl" />)}
          </div>
        </div>
      );
    }
    if (dataQuery.isError || !dataQuery.data?.data) {
      return <ErrorState title="The server is waking up, please wait a moment and try again" refetch={dataQuery.refetch} />;
    }
    if (dataQuery.data.data.length === 0) {
      return <DataContainer data={[]} pagination={dataQuery.data.pagination} locationParam={locationParam} totalItems={0} />;
    }
    return <DataContainer data={dataQuery.data.data} pagination={dataQuery.data.pagination} locationParam={locationParam} totalItems={dataQuery.data.pagination.totalItems} />;
  };

  return (
    <>
      {dataQuery.isFetching && (
        <div className="fixed inset-0 bg-black/10 z-[999] backdrop-blur-sm flex items-center justify-center">
          <Spinner scale={2} className="size-12" />
        </div>
      )}

      {/* Sticky search bar */}
      <div className={`fixed top-16 left-0 right-0 z-40 bg-[#1a2340] py-3 px-6 shadow-lg transition-all duration-300 ${stickyVisible ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"}`}>
        <div className="max-w-6xl mx-auto">
          <SearchBar location={locationParam} onSearch={handleSearch} />
        </div>
      </div>

      {/* Hero */}
      <div ref={heroRef} className="relative w-full h-[280px] sm:h-[380px] md:h-[460px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${heroImage}')` }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-4" style={{ overflow: "visible", zIndex: 10 }}>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
            {locationParam
              ? t("propertiesPage.heroTitle", { location: locationParam })
              : t("propertiesPage.heroTitleDefault")}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base hidden sm:block">
            {t("propertiesPage.heroSubtitle")}
          </p>
          <div className="w-full max-w-5xl px-2 sm:px-4" style={{ position: "relative", zIndex: 100 }}>
            <SearchBar location={locationParam} onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyFilter isOpen={filterOpen} onOpenChange={setFilterOpen} />
        {renderData()}
      </div>
    </>
  );
}
