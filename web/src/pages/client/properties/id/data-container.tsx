import { useState, useRef, useEffect } from "react";
import FormatedAmount from "@/components/shared/formatted-amount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GuestDetailHouseResponse } from "@/hooks/api/types/property.types";
import { useNavigate } from "react-router-dom";
import PropertyDetails from "./location";
import ReviewsContainer from "./reviews-container";
import BookingDialog from "@/pages/client/rooms/id/booking-dialog";
import { useClientAuth } from "@/hooks/use-client-auth";
import {
  ArrowLeft, Bath, BedDouble, MapPin, Phone, Mail,
  Wifi, Car, UtensilsCrossed, Users, Heart,
  ChevronRight, CheckCircle2, Image as ImageIcon, X, ChevronLeft,
  Plane, CarFront, Star, Clock, Shield, Coffee
} from "lucide-react";
import { FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";

// Admin contact section — shows SiteConfig contact, not owner contact
const AdminContactSection = () => {
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    import("@/hooks/api").then(({ api }) => {
      api.get("/site-config").then(res => setConfig(res.data)).catch(() => {});
    });
  }, []);
  return (
    <div className="space-y-2.5 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
      {config?.contactPhone ? (
        <a href={`tel:${config.contactPhone}`} className="flex items-center gap-2.5 text-sm hover:text-primary transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Phone className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>{config.contactPhone}</span>
        </a>
      ) : null}
      {config?.contactEmail ? (
        <a href={`mailto:${config.contactEmail}`} className="flex items-center gap-2.5 text-sm hover:text-primary transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Mail className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="truncate">{config.contactEmail}</span>
        </a>
      ) : null}
      {!config?.contactPhone && !config?.contactEmail && (
        <p className="text-sm text-muted-foreground">Contact us for more information</p>
      )}
    </div>
  );
};

interface Props { data: GuestDetailHouseResponse; }

const NAV_TABS = ["Overview", "Rooms", "Trip recommendations", "Facilities", "Reviews", "Location", "Policies"];
const PANEL_TABS = ["Facilities", "Reviews", "Location", "Policies", "Trip"];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  breakfast: <UtensilsCrossed className="w-4 h-4" />,
};

const DataContainer = ({ data }: Props) => {
  const property = data.data;
  const navigate = useNavigate();
  const { isFavorited, toggle } = useFavorites();
  const { isAuthenticated } = useClientAuth();
  const saved = isFavorited(property.id);
  const [activeTab, setActiveTab] = useState("Overview");
  const [stickyNav, setStickyNav] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<"all" | "rooms" | "property" | "nearby">("all");
  const [galleryStartIdx, setGalleryStartIdx] = useState(0);
  const [panelTab, setPanelTab] = useState<string | null>(null);
  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Detect private property (Villa / Guest House — booked as a whole)
  const isPrivate = ["VILLA", "GUEST_HOUSE"].includes(property.type) || (property as any).accessType === "PRIVATE";
  const isVilla = (property as any).type === "VILLA";
  const showPerNight = ["HOTEL", "APARTMENT"].includes(property.type);
  const pricePerNight = (property as any).pricePerNight as number | null | undefined;
  // For booking dialog we need a "room" object — use first room or a synthetic one
  const firstRoom = property.rooms?.[0];
  const bookingRoom = isPrivate && pricePerNight ? {
    id: firstRoom?.id || "property-booking",
    name: property.name,
    price: pricePerNight,
    availability: true,
    maxOccupancy: (property.rooms || []).reduce((sum: number, r: any) => sum + (r.maxOccupancy || 2), 0) || 10,
    discountPercent: (property as any).discountPercent ?? 0,
    property: { discountPercent: 0 },
  } : null;

  // Collect all booked ranges from the first room (for private property date blocking)
  const propertyBookedRanges = (firstRoom as any)?.bookings || [];

  const handleBookProperty = () => {
    if (!isAuthenticated) {
      navigate(`/auth/signin?callBackUrl=/properties/${property.id}`, { state: "booking" });
    } else {
      setBookingOpen(true);
    }
  };

  const avgRating = property.reviews?.length
    ? property.reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / property.reviews.length
    : 0;

  const ratingLabel =
    avgRating >= 4.5 ? "Exceptional"
    : avgRating >= 4 ? "Excellent"
    : avgRating >= 3.5 ? "Very Good"
    : avgRating > 0 ? "Good" : null;

  const starCount = Math.round(avgRating);

  const allImages = (property.images || []).filter((img: any) => !img.category || img.category === "property");
  const nearbyImgs = (property.images || []).filter((img: any) => img.category === "nearby");
  const mainImg = allImages[0]?.url;
  const roomImgs = (property.rooms || []).flatMap((r: any) => r.images || []);
  const gridSources = [...roomImgs, ...allImages.slice(1)];
  const thumbs = Array.from({ length: 4 }, (_, i) => gridSources[i] || null);
  const lightboxImages = [...allImages, ...roomImgs, ...nearbyImgs];

  const filteredGalleryImages =
    galleryFilter === "rooms" ? roomImgs
    : galleryFilter === "property" ? allImages
    : galleryFilter === "nearby" ? nearbyImgs
    : lightboxImages;

  const avgPrice = (() => {
    const prices = (property.rooms || []).map((r: any) => r.price).filter((p: number) => p > 0);
    return prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : null;
  })();

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setStickyNav(!e.isIntersecting), { threshold: 0 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (PANEL_TABS.includes(tab)) {
      setPanelTab(tab);
    } else if (tab === "Rooms") {
      setRoomsModalOpen(true);
    } else if (tab === "Trip recommendations") {
      setPanelTab("Trip");
    } else {
      scrollTo(tab.toLowerCase().replace(/ /g, "-"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Gallery Modal */}
      {galleryOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center sm:pt-8 sm:px-4" onClick={() => { setGalleryOpen(false); setGalleryStartIdx(0); setGalleryFilter("all"); }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-white dark:bg-zinc-900 rounded-none sm:rounded-2xl shadow-2xl flex w-full max-w-5xl h-full sm:max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-zinc-700 shrink-0">
                {galleryStartIdx > 0 && (
                  <button onClick={() => setGalleryStartIdx(0)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-primary text-primary text-xs sm:text-sm font-medium">
                  <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Property Images</span><span className="sm:hidden">Photos</span>
                </button>
                <button onClick={() => { setGalleryOpen(false); setGalleryStartIdx(0); setGalleryFilter("all"); }} className="ml-auto p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="flex gap-0 px-3 sm:px-4 border-b border-gray-100 dark:border-zinc-700 shrink-0 overflow-x-auto">
                {[
                  { label: `All (${lightboxImages.length})`, key: "all" as const },
                  ...(roomImgs.length > 0 ? [{ label: `Rooms (${roomImgs.length})`, key: "rooms" as const }] : []),
                  ...(allImages.length > 0 ? [{ label: `Views (${allImages.length})`, key: "property" as const }] : []),
                  ...(nearbyImgs.length > 0 ? [{ label: `Nearby (${nearbyImgs.length})`, key: "nearby" as const }] : []),
                ].map((tab) => (
                  <button key={tab.key} onClick={() => { setGalleryFilter(tab.key); setGalleryStartIdx(0); }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${galleryFilter === tab.key ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {galleryStartIdx > 0 ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
                    <button className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-white p-2 sm:p-2.5 bg-black/40 hover:bg-black/60 rounded-full z-10" onClick={() => setGalleryStartIdx(i => Math.max(1, i - 1))}>
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <img src={(filteredGalleryImages[galleryStartIdx - 1] as any)?.url} alt="" className="max-h-full max-w-full object-contain" />
                    <button className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-white p-2 sm:p-2.5 bg-black/40 hover:bg-black/60 rounded-full z-10" onClick={() => setGalleryStartIdx(i => Math.min(filteredGalleryImages.length, i + 1))}>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="h-[60px] sm:h-[72px] bg-black flex items-center gap-1 px-2 overflow-x-auto shrink-0">
                    <button onClick={() => setGalleryStartIdx(0)} className="flex flex-col items-center gap-0.5 px-2 py-1 text-white text-xs shrink-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded flex items-center justify-center"><ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></div>
                      <span className="hidden sm:block">Gallery</span>
                    </button>
                    {filteredGalleryImages.map((img, i) => (
                      <button key={i} onClick={() => setGalleryStartIdx(i + 1)}
                        className={`shrink-0 h-[44px] w-[60px] sm:h-[56px] sm:w-[72px] rounded overflow-hidden border-2 transition-colors ${galleryStartIdx === i + 1 ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                        <img src={(img as any).url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
                    {filteredGalleryImages.map((img, i) => (
                      <button key={i} onClick={() => setGalleryStartIdx(i + 1)} className="aspect-video rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                        <img src={(img as any).url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {filteredGalleryImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                      <p className="text-sm">No images in this category</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Right sidebar — hidden on mobile */}
            <div className="hidden sm:flex w-[200px] lg:w-[220px] shrink-0 border-l border-gray-200 dark:border-zinc-700 flex-col p-4 overflow-y-auto">
              <h3 className="font-bold text-sm mb-3">Things you'll love</h3>
              <ul className="space-y-2 mb-6 flex-1">
                {property.facilities?.slice(0, 4).map((f: any) => (
                  <li key={f.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />{f.name}
                  </li>
                ))}
                {property.location?.city && (
                  <li className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />Located in {property.location.city}
                  </li>
                )}
              </ul>
              <Button className="w-full rounded-full text-sm" onClick={() => {
                setGalleryOpen(false); setGalleryFilter("all");
                if (isPrivate) handleBookProperty(); else scrollTo("rooms");
              }}>
                {isPrivate ? "Book Property" : "Check availability"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Modal */}
      {roomsModalOpen && (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4" onClick={() => setRoomsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-background rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-bold">Select your room</h2>
                <p className="text-xs text-muted-foreground">{property.rooms?.length ?? 0} room types available</p>
              </div>
              <button onClick={() => setRoomsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Rooms list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {property.rooms?.length > 0 ? property.rooms.map((r: any) => {
                const bedrooms = r.features?.filter((f: any) => f.category?.toLowerCase() === "bedroom").length ?? 0;
                const bathrooms = r.features?.filter((f: any) => f.category?.toLowerCase() === "bathroom").length ?? 0;
                return (
                  <div key={r.id} className="border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-lg hover:border-primary/30 transition-all duration-200 bg-card">
                    <div className="sm:w-44 w-full shrink-0 bg-muted relative overflow-hidden">
                      {r.images?.[0]?.url ? (
                        <img src={r.images[0].url} alt={r.name} className="w-full h-36 sm:h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-36 sm:h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-sm text-primary hover:underline cursor-pointer" onClick={() => { setRoomsModalOpen(false); navigate(`/rooms/${r.id}`); }}>
                              {r.name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">{r.type}</span>
                              {bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{bedrooms} bed</span>}
                              {bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{bathrooms} bath</span>}
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {r.maxOccupancy}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {showPerNight && <p className="text-xs text-muted-foreground">per night</p>}
                            <FormatedAmount amount={r.price} className="font-bold text-base text-red-500" />
                          </div>
                        </div>
                        {r.services?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {r.services.slice(0, 3).map((s: any) => (
                              <span key={s.id} className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                                {s.name}{s.price ? ` (+ETB ${s.price})` : " (Free)"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full w-fit", r.availability ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>
                            {r.availability ? "Available" : "Unavailable"}
                          </span>
                          {!r.availability && r.bookings?.length > 0 && (() => {
                            const today = new Date(); today.setHours(0,0,0,0);
                            const active = r.bookings.filter((b: any) => b.checkIn && b.checkOut && new Date(b.checkOut) >= today);
                            const latest = active.reduce((l: Date | null, b: any) => { const co = new Date(b.checkOut); return !l || co > l ? co : l; }, null);
                            return latest ? <span className="text-xs text-muted-foreground">Until {latest.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> : null;
                          })()}
                        </div>
                        <Button size="sm" className="rounded-full px-4 text-xs h-7" onClick={() => { setRoomsModalOpen(false); navigate(`/rooms/${r.id}`); }}>
                          {isPrivate ? "View Details" : "Book this room"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No rooms available at this time.</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Scroll down to see rooms on the page too</p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setRoomsModalOpen(false); scrollTo("rooms"); }}>
                View on page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="py-3 px-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to search results
        </button>
      </div>

      {/* Photo grid — responsive: single image on mobile, grid on md+ */}
      <div ref={heroRef} className="px-2 sm:px-4 mb-0">
        <div className="flex gap-1.5 rounded-2xl overflow-hidden h-[220px] sm:h-[300px] md:h-[400px] lg:h-[460px] shadow-xl">
          {/* Main large image */}
          <div className="flex-[2] relative bg-muted cursor-pointer group overflow-hidden" onClick={() => { setGalleryStartIdx(0); setGalleryOpen(true); }}>
            {mainImg ? (
              <img src={mainImg} alt={property.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-14">
              <p className="text-white font-bold text-sm sm:text-base md:text-xl drop-shadow-lg line-clamp-1">{property.name}</p>
              {property.location?.city && (
                <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{property.location.city}
                </p>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggle(property.id); }}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110">
              <Heart className={cn("w-4 h-4 transition-colors", saved ? "fill-red-500 text-red-500" : "text-gray-600")} />
            </button>
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {lightboxImages.length}
            </div>
          </div>
          {/* 2x2 thumbnail grid — hidden on mobile */}
          <div className="hidden sm:grid flex-1 grid-cols-2 gap-1.5">
            {thumbs.map((img, i) => {
              const isLast = i === 3;
              const totalExtra = gridSources.length - 4;
              return (
                <div key={i} className="relative bg-muted overflow-hidden cursor-pointer group"
                  onClick={() => { if (img) { setGalleryStartIdx(i + 1); setGalleryOpen(true); } }}>
                  {img ? (
                    <>
                      <img src={(img as any).url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      {isLast && totalExtra > 0 && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
                          <span className="text-white text-lg font-bold">+{totalExtra}</span>
                          <span className="text-white/70 text-xs">more</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="w-6 h-6 text-muted-foreground opacity-20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <button onClick={() => { setGalleryStartIdx(0); setGalleryOpen(true); }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-full transition-all">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            See all {lightboxImages.length} photos
          </button>
          {avgRating > 0 && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(starCount, 5) }).map((_, i) => (
                  <FaStar key={i} className="w-3 h-3 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground hidden sm:inline">· {property.reviews?.length ?? 0} reviews</span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky nav */}
      <div className={cn(
        "bg-white dark:bg-zinc-900 border-b border-border transition-all duration-300 z-30",
        stickyNav ? "fixed top-16 left-0 right-0 shadow-md" : "relative mt-4"
      )}>
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {NAV_TABS.filter(tab => !(isVilla && tab === "Rooms")).map((tab) => (
            <button key={tab} onClick={() => handleTabClick(tab)}
              className={cn(
                "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      {stickyNav && <div className="h-[49px]" />}

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6 px-2 sm:px-4 py-4 sm:py-6">
        {/* Left column */}
        <div className="flex-1 min-w-0">

          {/* Overview */}
          <section id="overview" className="mb-10">
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs uppercase tracking-wide">{property.type || "Hotel"}</Badge>
                  {/* Furnishing status badge for APARTMENT and VILLA */}
                  {((property as any).type === "APARTMENT" || (property as any).type === "VILLA") && (property as any).furnishingStatus && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {((property as any).furnishingStatus as string).replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  )}
                  {property.location?.city && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{property.location.city}
                    </span>
                  )}
                </div>
                <h1 className="font-bold text-2xl md:text-3xl mb-2 leading-tight">{property.name}</h1>
                {starCount > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: Math.min(starCount, 5) }).map((_, i) => (
                      <FaStar key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{starCount}-star property</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 text-primary" />
                  <span>{property.address}</span>
                </div>
              </div>
            </div>

            {/* Quick highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: <Clock className="w-4 h-4 text-primary" />, label: "Check-in", value: "From 15:00" },
                { icon: <Clock className="w-4 h-4 text-primary" />, label: "Check-out", value: "Until 12:00" },
                { icon: <Shield className="w-4 h-4 text-primary" />, label: "Cancellation", value: "Free" },
                { icon: <Coffee className="w-4 h-4 text-primary" />, label: "Rooms", value: `${property.rooms?.length ?? 0} available` },
                ...((((property as any).type === "APARTMENT" || (property as any).type === "VILLA") && (property as any).furnishingStatus) ? [{
                  icon: <span className="text-primary text-sm">🛋️</span>,
                  label: "Furnishing",
                  value: ((property as any).furnishingStatus as string).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
                }] : []),
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="shrink-0">{icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {property.about?.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{property.about.description}</p>
              </div>
            )}
          </section>

          {/* Rooms / Villa Booking Section */}
          <section id="rooms" className="mb-10">
            {(property as any).type === "VILLA" ? (
              /* Villa — show as whole property booking, not room-by-room */
              <div>
                <h2 className="text-xl font-bold mb-5">Book This Villa</h2>
                <div className="border-2 border-primary/20 rounded-2xl overflow-hidden bg-card hover:shadow-lg transition-all">
                  <div className="flex flex-col sm:flex-row">
                    {allImages[0]?.url && (
                      <div className="sm:w-64 w-full shrink-0 bg-muted overflow-hidden">
                        <img src={allImages[0].url} alt={property.name} className="w-full h-48 sm:h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-xl">{property.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">VILLA</Badge>
                            {(property as any).furnishingStatus && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {((property as any).furnishingStatus as string).replace(/_/g, " ").toLowerCase()}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{property.location?.city}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {pricePerNight ? (
                            (() => {
                              const discount = (property as any).discountPercent ?? 0;
                              const discountedPrice = discount > 0 ? Math.round(pricePerNight * (1 - discount / 100)) : pricePerNight;
                              const hasDiscount = discount > 0;
                              return (
                                <div>
                                  {hasDiscount && (
                                    <p className="text-xs line-through text-muted-foreground">ETB {pricePerNight.toLocaleString()}</p>
                                  )}
                                  <FormatedAmount amount={discountedPrice} className="font-bold text-2xl text-primary" />
                                  {hasDiscount && (
                                    <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                                      🏷️ {discount}% off
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-sm text-muted-foreground">Contact for price</p>
                          )}
                        </div>
                      </div>

                      {property.about?.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{property.about.description}</p>
                      )}

                      {/* Facilities */}
                      {property.facilities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {property.facilities.slice(0, 5).map((f: any) => (
                            <span key={f.id} className="text-xs bg-muted px-2 py-0.5 rounded-full border border-border">
                              {f.name}
                            </span>
                          ))}
                          {property.facilities.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{property.facilities.length - 5} more</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                          🏡 Entire villa — exclusive use
                        </span>
                        <Button className="rounded-full px-6" onClick={handleBookProperty}>
                          Book This Villa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Non-villa — show rooms list */
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">{isPrivate ? "Property Details" : "Select your room"}</h2>
                  <span className="text-sm text-muted-foreground">{property.rooms?.length ?? 0} {isPrivate ? "spaces" : "room types"}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {property?.rooms?.length > 0 ? property.rooms.map((r: any) => {
                    const bedrooms = r.features?.filter((f: any) => f.category?.toLowerCase() === "bedroom").length ?? 0;
                    const bathrooms = r.features?.filter((f: any) => f.category?.toLowerCase() === "bathroom").length ?? 0;
                    return (
                      <div key={r.id} className="border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-lg hover:border-primary/30 transition-all duration-200 bg-card">
                        <div className="sm:w-56 w-full shrink-0 bg-muted relative overflow-hidden">
                          {r.images?.[0]?.url ? (
                            <img src={r.images[0].url} alt={r.name} className="w-full h-48 sm:h-full object-cover hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-48 sm:h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 text-muted-foreground opacity-30" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <h3 className="font-bold text-base text-primary hover:underline cursor-pointer" onClick={() => navigate(`/rooms/${r.id}`)}>
                                  {r.name}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  {bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{bedrooms} bed</span>}
                                  {bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{bathrooms} bath</span>}
                                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {r.maxOccupancy}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {showPerNight && <p className="text-xs text-muted-foreground">per night</p>}
                                <FormatedAmount amount={r.price} className="font-bold text-xl text-red-500" />
                              </div>
                            </div>
                            {r.services?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {r.services.slice(0, 4).map((s: any) => (
                                  <span key={s.id} className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                                    {s.name}{s.price ? ` (+ETB ${s.price})` : " (Free)"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full w-fit", r.availability ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>
                                {r.availability ? "Available" : "Unavailable"}
                              </span>
                              {!r.availability && r.bookings?.length > 0 && (() => {
                                const today = new Date(); today.setHours(0,0,0,0);
                                const active = r.bookings.filter((b: any) => b.checkIn && b.checkOut && new Date(b.checkOut) >= today);
                                const latest = active.reduce((l: Date | null, b: any) => { const co = new Date(b.checkOut); return !l || co > l ? co : l; }, null);
                                return latest ? <span className="text-xs text-muted-foreground">Until {latest.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> : null;
                              })()}
                            </div>
                            <Button size="sm" className="rounded-full px-5" onClick={() => navigate(`/rooms/${r.id}`)}>
                              {isPrivate ? "View Details" : "Book this room"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="border border-border rounded-2xl p-10 text-center text-muted-foreground bg-muted/20">
                      <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No rooms available at this time.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Trip Recommendations */}
          <section id="trip-recommendations" className="mb-10">
            <h2 className="text-xl font-bold mb-1">Plan your journey</h2>
            <p className="text-sm text-muted-foreground mb-4">Book your ride in advance for a hassle-free trip</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Plane className="w-8 h-8 text-primary" />, title: "Book your airport transfer", desc: "Get to your hotel easily and securely", url: "https://www.ethiopianairlines.com/en-ke/", label: "Search flights" },
                { icon: <CarFront className="w-8 h-8 text-primary" />, title: "Rent a car", desc: "Find an ideal ride for your trip", url: "https://ride8294.com/", label: "Search cars" },
              ].map(({ icon, title, desc, url, label }) => (
                <div key={title} className="border border-border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all bg-card">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-full" onClick={() => window.open(url, "_blank")}>{label}</Button>
                </div>
              ))}
            </div>
          </section>

          {/* Facilities */}
          {(() => {
            const propFacilities = property.facilities || [];
            const allRoomServices = Array.from(new Map(
              (property.rooms || []).flatMap((r: any) => r.services || []).map((s: any) => [s.name, s])
            ).values());
            if (propFacilities.length === 0 && allRoomServices.length === 0) return null;
            return (
              <section id="facilities" className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Services & Facilities</h2>
                  <button onClick={() => setPanelTab("Facilities")} className="text-sm text-primary hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Facilities</p>
                {propFacilities.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                    {propFacilities.slice(0, 6).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">{f.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-5">No facilities listed yet.</p>
                )}
                {allRoomServices.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Room Services</p>
                    <div className="flex flex-wrap gap-2">
                      {allRoomServices.slice(0, 10).map((s: any) => (
                        <span key={(s as any).id} className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-3 py-1 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {(s as any).name}{(s as any).price ? ` · ETB ${(s as any).price}` : " · Free"}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })()}

          {/* Reviews */}
          <section id="reviews" className="mb-10">
            <h2 className="text-xl font-bold mb-4">Guest Reviews</h2>
            {avgRating > 0 ? (
              <div className="flex items-center gap-4 mb-4 p-5 border border-border rounded-2xl cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all bg-card" onClick={() => setPanelTab("Reviews")}>
                <div className="bg-primary text-white font-bold text-2xl w-16 h-16 flex items-center justify-center rounded-2xl shadow-md shrink-0">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">{ratingLabel}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: Math.min(starCount, 5) }).map((_, i) => (
                      <FaStar key={i} className="w-3.5 h-3.5 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{property.reviews?.length ?? 0} verified reviews</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ) : (
              <div className="p-5 border border-border rounded-2xl text-center text-muted-foreground bg-muted/20">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No reviews yet. Be the first to review!</p>
              </div>
            )}
            <button onClick={() => setPanelTab("Reviews")} className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
              Read all reviews <ChevronRight className="w-4 h-4" />
            </button>
          </section>

          {/* Location */}
          <section id="location" className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Location</h2>
              <button onClick={() => setPanelTab("Location")} className="text-sm text-primary hover:underline flex items-center gap-1">
                View map <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border border-border rounded-2xl bg-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setPanelTab("Location")}>
              <div className="flex items-center gap-2 text-sm mb-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">{property.address}</span>
              </div>
              {property.location?.city && (
                <p className="text-xs text-muted-foreground ml-6">{property.location.city}{property.location.country ? `, ${property.location.country}` : ""}</p>
              )}
            </div>
          </section>

          {/* Policies */}
          <section id="policies" className="mb-10">
            <h2 className="text-xl font-bold mb-4">Property policies</h2>
            <div className="border border-border rounded-2xl overflow-hidden bg-card">
              {(() => {
                const rawPolicies = (property as any).policies;
                const policies: Array<{ key: string; value: string }> = Array.isArray(rawPolicies) && rawPolicies.length > 0
                  ? rawPolicies
                  : [
                    { key: "Check-in", value: "From 15:00" },
                    { key: "Check-out", value: "Until 12:00" },
                    { key: "Cancellation", value: "Free cancellation available" },
                    { key: "Children", value: "All children welcome" },
                    { key: "Pets", value: "Not allowed" },
                  ];
                return policies.map(({ key, value }, i) => (
                  <div key={key} className={cn("flex justify-between items-center px-5 py-3.5 text-sm", i < policies.length - 1 ? "border-b border-border" : "")}>
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ));
              })()}
            </div>
          </section>
        </div>

        {/* Right sticky card */}
        <div className="lg:w-[300px] w-full shrink-0">
          <div className="sticky top-24 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Price header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5">
              <p className="text-xs opacity-70 mb-1">{isPrivate ? ((property as any).type === "VILLA" ? "Villa Price" : "Price" + (showPerNight ? " per night (whole property)" : "")) : "Avg price" + (showPerNight ? " per night" : "")}</p>
              {isPrivate ? (
                pricePerNight ? (
                  (() => {
                    const propDiscount = (property as any).discountPercent ?? 0;
                    const discountedPrice = propDiscount > 0 ? Math.round(pricePerNight * (1 - propDiscount / 100)) : null;
                    return discountedPrice ? (
                      <div>
                        <p className="text-lg line-through opacity-60">ETB {pricePerNight.toLocaleString()}</p>
                        <p className="text-3xl font-bold">ETB {discountedPrice.toLocaleString()}</p>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium">{propDiscount}% off</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">ETB {pricePerNight.toLocaleString()}</p>
                    );
                  })()
                ) : <p className="text-lg font-semibold opacity-80">Price not set</p>
              ) : (
                avgPrice ? (
                  (() => {
                    const propDiscount = (property as any).discountPercent ?? 0;
                    const discountedPrice = propDiscount > 0 ? Math.round(avgPrice * (1 - propDiscount / 100)) : null;
                    return discountedPrice ? (
                      <div>
                        <p className="text-lg line-through opacity-60">ETB {avgPrice.toLocaleString()}</p>
                        <p className="text-3xl font-bold">ETB {discountedPrice.toLocaleString()}</p>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium">{propDiscount}% off</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">ETB {avgPrice.toLocaleString()}</p>
                    );
                  })()
                ) : <p className="text-lg font-semibold opacity-80">Contact for price</p>
              )}
              {avgRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">{avgRating.toFixed(1)}</div>
                  <span className="text-xs opacity-80">{ratingLabel} · {property.reviews?.length ?? 0} reviews</span>
                </div>
              )}
            </div>

            <div className="p-5">
              {isPrivate ? (
                <Button
                  className="w-full mb-4 font-bold rounded-xl h-11"
                  onClick={handleBookProperty}
                  disabled={!pricePerNight}
                >
                  {pricePerNight ? "Book Property" : "Price not set yet"}
                </Button>
              ) : (
                <Button className="w-full mb-4 font-bold rounded-xl h-11" onClick={() => scrollTo("rooms")}>
                  Check availability
                </Button>
              )}

              {/* Contact — show Admin contact from SiteConfig, not owner contact */}
              <AdminContactSection />

              {/* Quick facts */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick facts</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Rooms</span>
                  <span className="font-medium">{property.rooms?.length ?? 0} types</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Facilities</span>
                  <span className="font-medium">{property.facilities?.length ?? 0} listed</span>
                </div>
                {property.location?.city && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{property.location.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Panel */}
      {panelTab && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setPanelTab(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-6 pt-4 pb-0">
                <h2 className="text-lg font-bold">Property Information</h2>
                <button onClick={() => setPanelTab(null)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex overflow-x-auto">
                {PANEL_TABS.map((tab) => (
                  <button key={tab} onClick={() => setPanelTab(tab)}
                    className={cn("px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
                      panelTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {panelTab === "Facilities" && (
                <div>
                  <h3 className="text-lg font-bold mb-5">Services & Facilities</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Facilities</p>
                  {(property.facilities?.length > 0) ? (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {property.facilities.map((f: any) => (
                        <div key={f.id} className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mb-6">No facilities available at the moment.</p>
                  )}
                  {(() => {
                    const allServices = Array.from(new Map(
                      (property.rooms || []).flatMap((r: any) => r.services || []).map((s: any) => [s.name, s])
                    ).values());
                    return allServices.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Room Services</p>
                        <div className="flex flex-col gap-2">
                          {allServices.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between py-2.5 px-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">{s.name}</span>
                              </div>
                              <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                                {s.price ? `ETB ${s.price}` : "Free"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
              {panelTab === "Reviews" && (
                <div>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-2xl">
                      <div className="bg-primary text-white font-bold text-xl w-14 h-14 flex items-center justify-center rounded-2xl shrink-0">
                        {avgRating.toFixed(1)}
                      </div>
                      <div>
                        <p className="font-bold">{ratingLabel}</p>
                        <p className="text-sm text-muted-foreground">{property.reviews?.length ?? 0} verified reviews</p>
                      </div>
                    </div>
                  )}
                  <ReviewsContainer propertyId={property.id} />
                </div>
              )}
              {panelTab === "Location" && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Location</h3>
                  <PropertyDetails contact={property.contact} facilities={property.facilities as any} location={property.location} />
                </div>
              )}
              {panelTab === "Trip" && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Plan your journey</h3>
                  <p className="text-sm text-muted-foreground mb-5">Book your ride in advance for a hassle-free trip</p>
                  <div className="space-y-4">
                    {[
                      { icon: <Plane className="w-8 h-8 text-primary" />, title: "Book your airport transfer", desc: "Get to your hotel easily and securely", url: "https://www.ethiopianairlines.com/en-ke/", label: "Search flights" },
                      { icon: <CarFront className="w-8 h-8 text-primary" />, title: "Rent a car", desc: "Find an ideal ride for your trip", url: "https://ride8294.com/", label: "Search cars" },
                    ].map(({ icon, title, desc, url, label }) => (
                      <div key={title} className="border border-border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all bg-card">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
                          <div>
                            <p className="font-semibold text-sm">{title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full rounded-full" onClick={() => window.open(url, "_blank")}>{label}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {panelTab === "Policies" && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Property policies</h3>
                  <div className="border border-border rounded-2xl overflow-hidden">
                    {(() => {
                      const rawPolicies = (property as any).policies;
                      const policies: Array<{ key: string; value: string }> = Array.isArray(rawPolicies) && rawPolicies.length > 0
                        ? rawPolicies
                        : [
                          { key: "Check-in", value: "From 15:00" },
                          { key: "Check-out", value: "Until 12:00" },
                          { key: "Cancellation", value: "Free cancellation available" },
                          { key: "Children", value: "All children welcome" },
                          { key: "Pets", value: "Not allowed" },
                        ];
                      return policies.map(({ key, value }, i) => (
                        <div key={key} className={cn("flex justify-between items-center px-5 py-3.5 text-sm", i < policies.length - 1 ? "border-b border-border" : "")}>
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Booking Dialog for private properties */}
      {isPrivate && bookingRoom && (
        <BookingDialog
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          handleOpenBookingModal={handleBookProperty}
          room={bookingRoom}
          services={[]}
          bookedRanges={propertyBookedRanges}
          propertyId={property.id}
        />
      )}
    </div>
  );
};

export default DataContainer;

