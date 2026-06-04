import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Heart, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-4 py-12 sm:py-16 md:py-20 lg:py-18">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-balance">
              {t("about.heroTitle")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-balance">
              {t("about.heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-8 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {t("about.ourMission")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-foreground leading-relaxed mb-4">
                {t("about.missionText1")}
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                {t("about.missionText2")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <MapPin className="w-8 h-8 mx-auto mb-3 text-accent" />, titleKey: "about.nationwideCoverage", descKey: "about.nationwideDesc" },
                { icon: <Heart className="w-8 h-8 mx-auto mb-3 text-accent" />, titleKey: "about.curatedStays", descKey: "about.curatedDesc" },
                { icon: <Users className="w-8 h-8 mx-auto mb-3 text-accent" />, titleKey: "about.localCommunity", descKey: "about.localCommunityDesc" },
                { icon: <Award className="w-8 h-8 mx-auto mb-3 text-accent" />, titleKey: "about.qualityAssured", descKey: "about.qualityDesc" },
              ].map(({ icon, titleKey, descKey }) => (
                <Card key={titleKey} className="p-6 text-center">
                  {icon}
                  <h3 className="font-semibold text-sm sm:text-base mb-2">{t(titleKey)}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t(descKey)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">
            {t("about.whatWeValue")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { titleKey: "about.authenticity", descKey: "about.authenticityDesc" },
              { titleKey: "about.community", descKey: "about.communityDesc" },
              { titleKey: "about.sustainability", descKey: "about.sustainabilityDesc" },
            ].map(({ titleKey, descKey }) => (
              <Card key={titleKey} className="p-6 md:p-8 border-2 hover:border-accent transition-colors">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 text-primary">
                  {t(titleKey)}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t(descKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-4 py-12 md:py-16 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">
            {t("about.whyChooseUs")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              { titleKey: "about.easyPlatform", descKey: "about.easyPlatformDesc" },
              { titleKey: "about.transparentPricing", descKey: "about.transparentPricingDesc" },
              { titleKey: "about.support247", descKey: "about.supportDesc" },
              { titleKey: "about.verifiedReviews", descKey: "about.verifiedDesc" },
              { titleKey: "about.secureBooking", descKey: "about.secureDesc" },
              { titleKey: "about.localExpertise", descKey: "about.localExpertiseDesc" },
            ].map(({ titleKey, descKey }) => (
              <div key={titleKey} className="flex gap-4">
                <div className="flex-shrink-0 w-1 bg-accent rounded-full" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1 text-primary">{t(titleKey)}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
            {t("cta.readyToExplore")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
            {t("cta.startJourney")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties">
              <Button size="lg" className="text-base px-8">{t("cta.browseProperties")}</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
