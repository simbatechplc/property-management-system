import { useGetTrendingProperties } from "@/hooks/api/use-properties";
import SectionHeader from "./_components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { FaStar } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 8;
const MOBILE_ITEMS_PER_PAGE = 4; // 2×2 on mobile

const TrendingCard = ({ data }: { data: any }) => {
  const navigate = useNavigate();
  const img = data.images?.[0]?.url || data.rooms?.[0]?.images?.[0]?.url;
  const avgRating = data.reviews?.length
    ? data.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / data.reviews.length
    : 0;
  const prices = (data.rooms || []).map((r: any) => r.price).filter((p: number) => p > 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : (data.pricePerNight || 0);

  return (
    <div
      onClick={() => navigate(`/properties/${data.id}`)}
      className="cursor-pointer rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow duration-300 w-full"
    >
      <div className="relative bg-muted overflow-hidden" style={{ height: "180px" }}>
        {img ? (
          <img src={img} alt={data.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
          {data.type || "HOTEL"}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{data.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="line-clamp-1">{data.location?.city || data.address}</span>
        </div>
        <div className="flex items-center justify-between">
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(Math.round(avgRating), 5) }).map((_, i) => (
                  <FaStar key={i} className="w-2.5 h-2.5 text-yellow-400" />
                ))}
              </div>
            </div>
          )}
          {avgPrice > 0 && (
            <span className="text-xs font-bold text-red-500">
              Avg ETB {avgPrice.toLocaleString()}{["HOTEL", "APARTMENT"].includes(data.type) ? "/night" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertiesSection = () => {
  const dataQuery = useGetTrendingProperties();
  const properties: any[] = dataQuery.data?.data || [];
  const [page, setPage] = useState(0);
  const [mobilePage, setMobilePage] = useState(0);

  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const mobileTotalPages = Math.ceil(properties.length / MOBILE_ITEMS_PER_PAGE);
  const pageItems = properties.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const mobilePageItems = properties.slice(mobilePage * MOBILE_ITEMS_PER_PAGE, (mobilePage + 1) * MOBILE_ITEMS_PER_PAGE);

  return (
    <section className="c-px pb-10">
      <SectionHeader title="Trending Properties" />

      {dataQuery.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="w-full h-[260px] rounded-2xl" />)}
        </div>
      ) : dataQuery.isError || properties.length === 0 ? (
        <p className="text-muted-foreground text-sm">No trending properties yet.</p>
      ) : (
        <>
          {/* Mobile: 2×2 grid (4 items per page) */}
          <div className="md:hidden">
            <div className="grid grid-cols-2 gap-3">
              {mobilePageItems.map((d: any) => (
                <TrendingCard key={d.id} data={d} />
              ))}
            </div>
            {mobileTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={mobilePage === 0}
                  onClick={() => setMobilePage(p => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">{mobilePage + 1} / {mobileTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={mobilePage >= mobileTotalPages - 1}
                  onClick={() => setMobilePage(p => Math.min(mobileTotalPages - 1, p + 1))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Desktop: 4-column grid (8 items per page) — unchanged */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-4">
              {pageItems.map((d: any) => (
                <TrendingCard key={d.id} data={d} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default PropertiesSection;
