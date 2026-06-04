import { useTranslation } from "react-i18next";
import HeroSection from "./hero-section";
import LocationsSection from "./locations-section";
import PropertiesSection from "./properties-section";
import { PropertyStats } from "./stats-section";

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      {/* Stats bar */}
      <div className="bg-primary text-primary-foreground py-4">
        <div className="c-px flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {[
            { value: "4+", labelKey: "stats.properties" },
            { value: "3+", labelKey: "stats.cities" },
            { value: "10+", labelKey: "stats.happyGuests" },
            { value: "4.5★", labelKey: "stats.avgRating" },
          ].map((s) => (
            <div key={s.labelKey}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-primary-foreground/70">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <LocationsSection />
      <PropertiesSection />
      <PropertyStats />

      {/* CTA Section */}
      <section className="c-px py-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("cta.readyToFind")}</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto text-sm md:text-base">
            {t("cta.browseSubtitle")}
          </p>
          <a href="/properties" className="inline-block bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-white/90 transition-colors text-sm md:text-base">
            {t("cta.exploreAll")}
          </a>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
