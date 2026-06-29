import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, ArrowRight, Hotel, Home, Building2, TreePine, Tent, Warehouse } from "lucide-react";

const PROPERTY_TYPES = [
  { label: "Hotels", value: "HOTEL", icon: <Hotel className="w-3.5 h-3.5" /> },
  { label: "Guest Houses", value: "GUEST_HOUSE", icon: <Home className="w-3.5 h-3.5" /> },
  { label: "Apartments", value: "APARTMENT", icon: <Building2 className="w-3.5 h-3.5" /> },
  { label: "Resorts", value: "RESORT", icon: <TreePine className="w-3.5 h-3.5" /> },
  { label: "Villas", value: "VILLA", icon: <Tent className="w-3.5 h-3.5" /> },
  { label: "Hostels", value: "HOSTEL", icon: <Warehouse className="w-3.5 h-3.5" /> },
];

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 mt-8">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      <div className="w-full px-4 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Kuru Rent</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              Discover and book the best properties across Ethiopia. From luxury hotels to cozy guest houses — your perfect stay awaits.
            </p>
            <div className="flex items-center gap-2.5">
              {[{ Icon: Facebook, label: "Facebook" }, { Icon: Twitter, label: "Twitter" }, { Icon: Instagram, label: "Instagram" }, { Icon: Youtube, label: "Youtube" }].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-primary flex items-center justify-center transition-all hover:scale-110">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Property Types</h3>
            <ul className="space-y-2.5">
              {PROPERTY_TYPES.map((t) => (
                <li key={t.value}>
                  <Link to={`/properties?type=${t.value}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors group">
                    <span className="text-zinc-600 group-hover:text-primary transition-colors">{t.icon}</span>
                    {t.label}
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Home", href: "/" },
                { label: "All Properties", href: "/properties" },
                { label: "Nearby Properties", href: "/nearby" },
                { label: "About Us", href: "/about" },
                { label: "Register Property", href: "/register" },
                { label: "My Bookings", href: "/account/bookings" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-sm hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-zinc-400">Bole, Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <a href="tel:+251911000000" className="hover:text-primary transition-colors">+251 911 000 000</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <a href="mailto:info@kururent.et" className="hover:text-primary transition-colors">info@kururent.et</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} <span className="text-zinc-400 font-medium">Kuru Rent</span>. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
              <a key={label} href="#" className="hover:text-zinc-300 transition-colors">{label}</a>
            ))}
          </div>
        </div>

        {/* Powered by Section */}
        <div className="border-t border-zinc-800/50 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
          <p className="text-zinc-600">
            Powered by{" "}
            <a 
              href="https://simbatech.et/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Simbatech Trading PLC
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
