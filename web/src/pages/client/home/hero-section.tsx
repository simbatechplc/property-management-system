"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FilterTab from "./_components/filter-tab";
import { api } from "@/hooks/api";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1561501900-3701fa6a0864?ixlib=rb-4.1.0&fm=jpg&q=60&w=3000",
  "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/2b/7d/7c/caption.jpg?w=1200&h=-1&s=1",
  "https://imgix.brilliant-ethiopia.com/lake-awasa-2.jpg?auto=format,enhance,compress&fit=crop&w=1600&h=600&q=60",
  "https://imgix.brilliant-ethiopia.com/fasil-ghebbi-royal-enclosure-gondar.jpg?auto=format,enhance,compress&fit=crop&crop=entropy,faces,focalpoint&w=1880&h=740&q=30",
  "https://tuckmagazine.com/wp-content/uploads/2018/12/addis.jpg",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?fm=jpg&q=60&w=3000",
];

const HeroSection = () => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [siteTitle, setSiteTitle] = useState("");
  const [siteSubtitle, setSiteSubtitle] = useState("");

  useEffect(() => {
    api.get("/site-config").then(res => {
      // Only use site-config values if they exist (admin-customised); otherwise fall back to i18n
      if (res.data.heroTitle) setSiteTitle(res.data.heroTitle);
      if (res.data.heroSubtitle) setSiteSubtitle(res.data.heroSubtitle);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeout(() => setCurrent(c => (c + 1) % HERO_IMAGES.length), 1000);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // If admin has set a custom title use it, otherwise use the translated default
  const heroTitle = siteTitle || t("hero.defaultTitle");
  const heroSubtitle = siteSubtitle || t("hero.defaultSubtitle");

  return (
    <div className="w-full relative flex flex-col items-center justify-center min-h-[480px] md:min-h-[520px] overflow-hidden">
      {HERO_IMAGES.map((src, i) => (
        <div key={src} className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}>
          <img className="object-cover w-full h-full" src={src} alt="" />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/45 z-10" />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`} />
        ))}
      </div>

      <div className="relative z-20 text-center px-4 mb-6">
        <h1 className="font-bold text-3xl md:text-4xl text-white mb-2 drop-shadow-lg">{heroTitle}</h1>
        <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto">{heroSubtitle}</p>
      </div>

      <div className="relative z-20 w-[95%] md:w-[780px] lg:w-[860px]">
        <FilterTab />
      </div>
    </div>
  );
};

export default HeroSection;
