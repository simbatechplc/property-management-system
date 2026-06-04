import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Youtube, Instagram, Send, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/hooks/api";

const GOLD = "#c9a227";

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

interface SiteConfig {
  siteName: string; logoUrl?: string; tagline?: string;
  youtube?: string; tiktok?: string; telegram?: string; instagram?: string;
  contactPhone?: string; contactEmail?: string; contactAddress?: string;
  extraSocials?: { label: string; url: string }[];
}

export function Footer() {
  const { t } = useTranslation();
  const LOGO_URL = "https://res.cloudinary.com/dmhsqmdbc/image/upload/v1776093694/bete_uploads/nvducfh9nbyixyatxrp9.jpg";
  const [config, setConfig] = useState<SiteConfig>({ siteName: "Kuru Rent", logoUrl: LOGO_URL, tagline: "Guesthouse · Apartment · Villa" });

  useEffect(() => {
    api.get("/site-config").then(res => setConfig({
      ...res.data,
      siteName: res.data.siteName || "Kuru Rent",
      logoUrl: res.data.logoUrl || LOGO_URL,
    })).catch(() => {});
  }, []);

  const socialLinks = [
    { href: config.youtube, icon: <Youtube className="w-4 h-4" />, label: "YouTube" },
    { href: config.tiktok, icon: <TikTokIcon />, label: "TikTok" },
    { href: config.telegram, icon: <Send className="w-4 h-4" />, label: "Telegram" },
    { href: config.instagram, icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
    ...(config.extraSocials || []).filter(s => s.url).map(s => ({
      href: s.url, icon: <Globe className="w-4 h-4" />, label: s.label || "Link",
    })),
  ].filter(s => s.href);

  const propertyTypeKeys = [
    { key: "hotels", value: "HOTELS" },
    { key: "guestHouses", value: "GUEST_HOUSES" },
    { key: "apartments", value: "APARTMENTS" },
    { key: "resorts", value: "RESORTS" },
    { key: "villas", value: "VILLAS" },
    { key: "hostels", value: "HOSTELS" },
  ];

  const quickLinks = [
    { labelKey: "footer.home", href: "/" },
    { labelKey: "footer.allProperties", href: "/properties" },
    { labelKey: "footer.nearby", href: "/nearby" },
    { labelKey: "footer.aboutUs", href: "/about" },
    { labelKey: "footer.registerProperty", href: "/register" },
    { labelKey: "footer.myBookings", href: "/account/bookings" },
  ];

  return (
    <footer className="bg-[#1a4a2e] mt-16" style={{ color: GOLD }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt={config.siteName} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#c9a227] flex items-center justify-center">
                  <span className="text-[#1a4a2e] font-bold text-sm">{config.siteName?.[0] || "K"}</span>
                </div>
              )}
              <span className="text-xl font-bold" style={{ color: GOLD }}>{config.siteName || "Kuru Rent"}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: `${GOLD}cc` }}>
              {config.tagline || "Discover and book the best properties across Ethiopia. From hotels to guest houses, find your perfect stay."}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map(({ href, icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
                    style={{ backgroundColor: "#c9a22722", color: GOLD }} aria-label={label}>
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Property Types */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: GOLD }}>{t("footer.propertyTypes")}</h3>
            <ul className="space-y-2 text-sm">
              {propertyTypeKeys.map(({ key, value }) => (
                <li key={key}>
                  <Link to={`/properties?type=${value}`}
                    className="transition-colors hover:opacity-80" style={{ color: `${GOLD}cc` }}>
                    {t(`propertyTypes.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: GOLD }}>{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map(({ labelKey, href }) => (
                <li key={href}>
                  <Link to={href} className="transition-colors hover:opacity-80" style={{ color: `${GOLD}cc` }}>
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: GOLD }}>{t("footer.contactUs")}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
                <span style={{ color: `${GOLD}cc` }}>{config.contactAddress || "Bole, Addis Ababa, Ethiopia"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                <a href={`tel:${config.contactPhone || "+251911000000"}`} className="hover:opacity-80 transition-colors" style={{ color: `${GOLD}cc` }}>
                  {config.contactPhone || "+251 911 000 000"}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                <a href={`mailto:${config.contactEmail || "info@kururent.et"}`} className="hover:opacity-80 transition-colors" style={{ color: `${GOLD}cc` }}>
                  {config.contactEmail || "info@kururent.et"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: `${GOLD}33`, color: `${GOLD}99` }}>
          <p>© {new Date().getFullYear()} {config.siteName || "Kuru Rent"}. {t("footer.allRightsReserved")}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-80 transition-colors">{t("footer.privacyPolicy")}</a>
            <a href="#" className="hover:opacity-80 transition-colors">{t("footer.termsOfService")}</a>
            <a href="#" className="hover:opacity-80 transition-colors">{t("footer.cookiePolicy")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
