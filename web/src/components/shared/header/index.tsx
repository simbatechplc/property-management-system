"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, LogOut, Menu, Settings, User, Heart, ChevronDown, Hotel, Home, Building2, TreePine, Tent, Warehouse, MapPin, Bookmark } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ModeToggle } from "../mode-toggle";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "../avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClientAuth } from "@/hooks/use-client-auth";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../language-toggle";

const PROPERTY_TYPE_KEYS = [
  { key: "hotels", value: "HOTEL", icon: <Hotel className="w-4 h-4" />, color: "text-blue-500" },
  { key: "guestHouses", value: "GUEST_HOUSE", icon: <Home className="w-4 h-4" />, color: "text-green-500" },
  { key: "apartments", value: "APARTMENT", icon: <Building2 className="w-4 h-4" />, color: "text-purple-500" },
  { key: "resorts", value: "RESORT", icon: <TreePine className="w-4 h-4" />, color: "text-emerald-500" },
  { key: "villas", value: "VILLA", icon: <Tent className="w-4 h-4" />, color: "text-orange-500" },
  { key: "hostels", value: "HOSTEL", icon: <Warehouse className="w-4 h-4" />, color: "text-pink-500" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/nearby", label: "Nearby", icon: <MapPin className="w-3.5 h-3.5" /> },
  { href: "/about", label: "About" },
  { href: "/register", label: "Register" },
];

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [propDropdown, setPropDropdown] = useState(false);

  const PROPERTY_TYPES = PROPERTY_TYPE_KEYS.map((p) => ({
    ...p,
    label: t(`propertyTypes.${p.key}`),
  }));

  const selectedType = new URLSearchParams(location.search).get("type");
  const activePropertyLabel = selectedType
    ? (PROPERTY_TYPES.find((t) => t.value === selectedType)?.label ?? t("nav.properties"))
    : t("nav.properties");
  const dropRef = useRef<HTMLDivElement>(null);
  const { data, isPending } = authClient.useSession();
  const { signOut, isAuthenticated } = useClientAuth();
  const navigate = useNavigate();

  // Load site config for logo/name — default to Kuru Rent brand
  const LOGO_URL = "https://res.cloudinary.com/dmhsqmdbc/image/upload/v1776093694/bete_uploads/nvducfh9nbyixyatxrp9.jpg";
  const [siteConfig, setSiteConfig] = useState<{ siteName?: string; logoUrl?: string }>({
    siteName: "Kuru Rent",
    logoUrl: LOGO_URL,
  });
  useEffect(() => {
    import("@/hooks/api").then(({ api }) => {
      api.get("/site-config").then(res => {
        setSiteConfig({
          siteName: res.data.siteName || "Kuru Rent",
          logoUrl: res.data.logoUrl || LOGO_URL,
        });
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setPropDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href: string) => location.pathname === href;

  const UserMenu = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border px-2 py-1 hover:shadow-md transition-shadow">
          <Menu className="w-4 h-4 text-muted-foreground" />
          <Avatar src={data?.user?.image!} fallback={data?.user?.name ?? ""} className="w-7 h-7" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="end">
        <div className="flex gap-2.5 items-center px-3 py-2.5 border-b mb-2 bg-muted/30 rounded-lg">
          <Avatar src={data?.user?.image || ""} fallback={data?.user?.name ?? ""} className="w-9 h-9" />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate">{data?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{data?.user?.email}</p>
          </div>
        </div>
        <button className="w-full text-start text-sm px-3 py-2 rounded-lg flex items-center gap-2.5 hover:bg-muted transition-colors" onClick={() => navigate("/account")}>
          <Settings className="w-4 h-4 text-muted-foreground" /> {t("nav.accountSettings")}
        </button>
        <button className="w-full text-start text-sm px-3 py-2 rounded-lg flex items-center gap-2.5 hover:bg-muted transition-colors" onClick={() => navigate("/account/bookings")}>
          <Bookmark className="w-4 h-4 text-muted-foreground" /> {t("nav.myBookings")}
        </button>
        <div className="border-t my-1" />
        <button className="w-full text-start text-sm px-3 py-2 rounded-lg flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-destructive transition-colors" onClick={() => signOut()}>
          <LogOut className="w-4 h-4" /> {t("nav.signOut")}
        </button>
      </PopoverContent>
    </Popover>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a4a2e]/30 bg-[#1a4a2e] text-white">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">

          {/* Logo + Nav grouped on left */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-primary/30 group-hover:shadow-md transition-shadow overflow-hidden">
                {siteConfig.logoUrl ? (
                  <img src={siteConfig.logoUrl} alt={siteConfig.siteName || "Kuru Rent"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground font-bold text-lg">{(siteConfig.siteName || "Kuru Rent")[0]}</span>
                )}
              </div>
              <span
                className="text-2xl font-bold text-[#c9a227] tracking-tight transition-all duration-300"
                style={{
                  textShadow: "0 1px 0 #8a6d0a, 0 2px 0 #7a5d08, 0 3px 6px rgba(0,0,0,0.4)",
                  display: "inline-block",
                  transition: "transform 0.2s, text-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.transform = "perspective(200px) rotateX(8deg) scale(1.05)";
                  (e.target as HTMLElement).style.textShadow = "0 2px 0 #8a6d0a, 0 4px 0 #7a5d08, 0 6px 12px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.transform = "";
                  (e.target as HTMLElement).style.textShadow = "0 1px 0 #8a6d0a, 0 2px 0 #7a5d08, 0 3px 6px rgba(0,0,0,0.4)";
                }}
              >
                {siteConfig.siteName || "Kuru Rent"}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              <Link to="/"
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive("/") ? "bg-white/20 text-[#c9a227]" : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                )}>
                {t("nav.home")}
              </Link>

              {/* Properties dropdown */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setPropDropdown(d => !d)}
                  className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    location.pathname.startsWith("/properties") ? "bg-white/20 text-[#c9a227]" : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                  )}
                >
                  {activePropertyLabel}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", propDropdown && "rotate-180")} />
                </button>
                {propDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link to="/properties" onClick={() => setPropDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5 border-b border-border transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {t("nav.allProperties")}
                    </Link>
                    {/* Private / Shared access type filters */}
                    <div className="px-3 py-2 flex gap-2 border-b border-border">
                      <Link to="/properties?accessType=PRIVATE" onClick={() => setPropDropdown(false)}
                        className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                        {t("nav.private")}
                      </Link>
                      <Link to="/properties?accessType=SHARED" onClick={() => setPropDropdown(false)}
                        className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                        {t("nav.shared")}
                      </Link>
                    </div>
                    <div className="p-1.5">
                      {PROPERTY_TYPES.map((pt) => (
                        <Link key={pt.value} to={`/properties?type=${pt.value}`} onClick={() => setPropDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors">
                          <span className={pt.color}>{pt.icon}</span>
                          {pt.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/nearby"
                className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive("/nearby") ? "bg-white/20 text-[#c9a227]" : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                )}>
                <MapPin className="w-3.5 h-3.5" /> {t("nav.nearby")}
              </Link>

              <Link to="/about"
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive("/about") ? "bg-white/20 text-[#c9a227]" : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                )}>
                {t("nav.about")}
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
            {isPending ? null : data?.user ? (
              <>
                <button onClick={() => navigate("/account/bookings")}
                  className="flex items-center gap-1.5 text-sm text-[#c9a227]/80 hover:text-[#c9a227] px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="hidden lg:inline">{t("nav.saved")}</span>
                </button>
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/auth/register")}>Register</Button>
                <Button size="sm" className="rounded-full px-5 bg-[#c9a227] hover:bg-[#b8911f] text-[#1a4a2e] font-bold border-0" onClick={() => navigate("/auth/signin")}>{t("nav.signIn")}</Button>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
            {data?.user && <UserMenu />}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col justify-between px-4 pb-6 w-[85vw] max-w-xs overflow-y-auto">
                <div>
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                        {siteConfig.logoUrl
                          ? <img src={siteConfig.logoUrl} alt={siteConfig.siteName || "Kuru Rent"} className="w-full h-full object-cover" />
                          : <span className="text-primary-foreground font-bold text-sm">{(siteConfig.siteName || "Kuru Rent")[0]}</span>}
                      </div>
                      {siteConfig.siteName || "Kuru Rent"}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { href: "/", label: t("nav.home") },
                      { href: "/nearby", label: t("nav.nearby") },
                      { href: "/about", label: t("nav.about") },
                    ].map(({ href, label }) => (
                      <Link key={href} to={href} onClick={() => setOpen(false)}
                        className={cn("text-sm font-medium px-3 py-2.5 rounded-xl transition-colors", isActive(href) ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted")}>
                        {label}
                      </Link>
                    ))}
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">{t("nav.properties")}</div>
                    <Link to="/properties" onClick={() => setOpen(false)} className="text-sm font-medium px-3 py-2 rounded-xl text-primary hover:bg-primary/5">{t("nav.allProperties")}</Link>
                    <div className="flex gap-2 px-3 py-1">
                      <Link to="/properties?accessType=PRIVATE" onClick={() => setOpen(false)}
                        className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                        {t("nav.private")}
                      </Link>
                      <Link to="/properties?accessType=SHARED" onClick={() => setOpen(false)}
                        className="flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                        {t("nav.shared")}
                      </Link>
                    </div>
                    {PROPERTY_TYPES.map((pt) => (
                      <Link key={pt.value} to={`/properties?type=${pt.value}`} onClick={() => setOpen(false)}
                        className="text-sm px-3 py-2 rounded-xl text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2.5 ml-2">
                        <span className={pt.color}>{pt.icon}</span>{pt.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => { navigate("/auth/register"); setOpen(false); }}>{t("auth.register")}</Button>
                    <Button className="w-full rounded-xl" onClick={() => { navigate("/auth/signin"); setOpen(false); }}><User className="h-4 w-4 mr-2" /> {t("nav.signIn")}</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
