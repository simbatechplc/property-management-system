import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";

const DISTANCE_OPTIONS = [1, 3, 5, 10, 20, 50, 100];

export function NearbyEmptyState() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentDistance = Number(searchParams.get("distance")) || 10;

  const handleSelect = (distance: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("distance", String(distance));
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <EmptyState
      icon={<Home className="w-8 h-8" />}
      title={t("nearbyData.noNearby")}
      description={t("nearbyData.noNearbyDesc", { distance: currentDistance })}
      primaryActions={
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {DISTANCE_OPTIONS.map((distance) => (
            <Button key={distance} variant={distance === currentDistance ? "default" : "outline"} size="sm"
              onClick={() => handleSelect(distance)}
              className={cn("transition-all", distance === currentDistance && "shadow-sm")}>
              {distance >= 100 ? "100+ km" : distance >= 20 ? `${distance}+ km` : `${distance} km`}
            </Button>
          ))}
        </div>
      }
    />
  );
}
