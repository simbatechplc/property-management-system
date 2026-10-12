import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { MapPin, Search, Building2, Home, Clock, PlaneTakeoff, ArrowLeftRight, CalendarDays, Clock3, Users, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationFilter } from "./location-filter";
import { useNavigate } from "react-router-dom";
import { PropertyFilter } from "@/components/shared/filter";

type TabType = "hotels" | "homes" | "longstay" | "transport";

const BOX = "bg-white border-2 border-gray-300 rounded-lg hover:border-primary transition-colors duration-200";
const LABEL = "text-xs font-semibold text-gray-500 mb-1";
const VALUE = "text-sm font-semibold text-gray-900";
const PLACEHOLDER = "text-sm text-gray-400";

const FilterTab = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("longstay");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState<number>(1);
  const [location, setLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>();
  const [passengers, setPassengers] = useState<number>(1);
  const [pickupTime, setPickupTime] = useState("12:00");
  const [transferDirection, setTransferDirection] = useState<"from" | "to">("from");
  const [locDark, setLocDark] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "longstay", label: t("filterTabs.guestHouse"), icon: <Clock className="w-4 h-4" /> },
    { id: "hotels", label: t("filterTabs.hotels"), icon: <Building2 className="w-4 h-4" /> },
    { id: "homes", label: t("filterTabs.homesApts"), icon: <Home className="w-4 h-4" /> },
    // { id: "transport", label: t("filterTabs.airportTransfer"), icon: <Plane className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const id = setInterval(() => setLocDark((d) => !d), 2000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) {
      if (location.includes(", ")) {
        const parts = location.split(", ");
        params.set("subcity", parts[0].trim());
        params.set("city", parts[1].trim());
      } else {
        params.set("search", location.trim());
      }
    }
    if (checkIn) params.set("checkIn", checkIn.toISOString());
    if (checkOut) params.set("checkOut", checkOut.toISOString());
    if (guests > 1) params.set("guests", String(guests));
    if (activeTab === "homes") params.set("type", "APARTMENT");
    else if (activeTab === "longstay") { params.set("type", "GUEST_HOUSE"); params.set("longstay", "true"); }
    else if (activeTab === "hotels") params.set("type", "HOTEL");
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
        {/* Tab bar */}
        <div className="flex border-b-2 border-gray-200 overflow-x-auto bg-white">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
                activeTab === tab.id ? "border-b-2 border-primary text-primary bg-primary/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50")}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 bg-white">
          {activeTab === "hotels" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className={cn("border-2 rounded-lg px-4 py-3 relative cursor-pointer transition-colors duration-700",
                  locDark ? "bg-[#1a4a2e] border-[#1a4a2e]" : "bg-white border-gray-300 hover:border-primary")}>
                  <p className={cn("text-xs font-semibold mb-1", locDark ? "text-[#c9a227]" : "text-gray-500")}>{t("search.destination")}</p>
                  <LocationFilter location={location} setLocation={setLocation} dark={locDark} />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(BOX, "px-4 py-3 text-left w-full")}>
                      <p className={LABEL}>{t("search.checkInShort")}</p>
                      <p className={checkIn ? VALUE : PLACEHOLDER}>{checkIn ? format(checkIn, "EEE, MMM d") : t("search.addDate")}</p>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(BOX, "px-4 py-3 text-left w-full")}>
                      <p className={LABEL}>{t("search.checkOutShort")}</p>
                      <p className={checkOut ? VALUE : PLACEHOLDER}>{checkOut ? format(checkOut, "EEE, MMM d") : t("search.addDate")}</p>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-3 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(BOX, "px-4 py-3 text-left flex-1 md:flex-none md:w-48")}>
                      <p className={LABEL}>{t("search.guests")}</p>
                      <p className={VALUE}>{t("search.guest", { count: guests })}</p>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-4" align="start">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("search.guests")}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGuests(p => Math.max(1, p - 1))} disabled={guests <= 1}>-</Button>
                        <span className="w-5 text-center text-sm">{guests}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGuests(p => p + 1)}>+</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <button onClick={() => setFilterOpen(true)} className={cn(BOX, "px-4 py-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900")}>
                  <Filter className="w-4 h-4" />
                  <span className="hidden md:inline">{t("search.moreFilters")}</span>
                </button>
                <button onClick={handleSearch} className="flex-1 bg-primary hover:bg-primary/90 text-[#c9a227] rounded-lg py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md">
                  <Search className="w-4 h-4" />{t("search.search")}
                </button>
              </div>
            </>
          ) : activeTab === "homes" || activeTab === "longstay" ? (
            <>
              <div className={cn("border-2 rounded-lg px-4 py-3 flex items-center gap-3 mb-3 cursor-pointer transition-colors duration-700",
                locDark ? "bg-[#1a4a2e] border-[#1a4a2e]" : "bg-white border-gray-300 hover:border-primary")}>
                <Search className="w-4 h-4 shrink-0 text-gray-400" />
                <LocationFilter location={location} setLocation={setLocation} dark={locDark} />
              </div>
              <div className="border-2 border-gray-300 rounded-lg flex divide-x-2 divide-gray-300 mb-4 overflow-hidden bg-white">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className={checkIn ? VALUE : PLACEHOLDER}>{checkIn ? format(checkIn, "d MMM yyyy") : t("search.checkInDate")}</p>
                        {checkIn && <p className="text-xs text-gray-400">{format(checkIn, "EEEE")}</p>}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className={checkOut ? VALUE : PLACEHOLDER}>{checkOut ? format(checkOut, "d MMM yyyy") : t("search.checkOutDate")}</p>
                        {checkOut && <p className="text-xs text-gray-400">{format(checkOut, "EEEE")}</p>}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className={VALUE}>{t("search.adult", { count: guests })}</p>
                        <p className="text-xs text-gray-400">{t("search.room", { count: 1 })}</p>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-4" align="end">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("search.adults")}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGuests(p => Math.max(1, p - 1))} disabled={guests <= 1}>-</Button>
                        <span className="w-5 text-center text-sm">{guests}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGuests(p => p + 1)}>+</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-center">
                <button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-[#c9a227] rounded-full py-3 px-16 text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors shadow-md">
                  <Search className="w-4 h-4" />{t("search.search")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {(["from", "to"] as const).map((dir) => (
                  <button key={dir} onClick={() => setTransferDirection(dir)}
                    className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors",
                      transferDirection === dir ? "bg-white border-primary text-primary shadow-sm" : "border-gray-300 text-gray-500 hover:border-primary/50")}>
                    {dir === "from" ? t("filterTabs.fromAirport") : t("filterTabs.toAirport")}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(BOX, "flex-1 px-4 py-3 flex items-center gap-3")}>
                  <PlaneTakeoff className="w-4 h-4 text-gray-400 shrink-0" />
                  <input className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-400 placeholder:font-normal"
                    placeholder={t("filterTabs.pickupAirport")} value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
                </div>
                <button onClick={() => { const tmp = pickupLocation; setPickupLocation(dropoffLocation); setDropoffLocation(tmp); }}
                  className="p-2 rounded-full border-2 border-gray-300 hover:border-primary hover:bg-gray-50 transition-colors shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-gray-500" />
                </button>
                <div className={cn(BOX, "flex-1 px-4 py-3 flex items-center gap-3")}>
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <input className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-400 placeholder:font-normal"
                    placeholder={t("filterTabs.destinationLocation")} value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} />
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg flex divide-x-2 divide-gray-300 mb-4 overflow-hidden bg-white">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className={pickupDate ? VALUE : PLACEHOLDER}>{pickupDate ? format(pickupDate, "EEE, MMM d") : t("filterTabs.pickupDate")}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="flex-1 px-4 py-3 flex items-center gap-3">
                  <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                  <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                    className="flex-1 text-sm font-semibold text-gray-900 bg-transparent outline-none cursor-pointer" />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className={VALUE}>{t("filterTabs.passenger", { count: passengers })}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-4" align="start">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("filterTabs.passengers")}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPassengers(p => Math.max(1, p - 1))} disabled={passengers <= 1}>-</Button>
                        <span className="w-5 text-center text-sm">{passengers}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPassengers(p => p + 1)}>+</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-center">
                <button onClick={() => window.open("https://ride8294.com/", "_blank")}
                  className="bg-primary hover:bg-primary/90 text-[#c9a227] rounded-full py-3 px-16 text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                  <Search className="w-4 h-4" />{t("search.search")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <PropertyFilter isOpen={filterOpen} onOpenChange={setFilterOpen} />
    </>
  );
};

export default FilterTab;
