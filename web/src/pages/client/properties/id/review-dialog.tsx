"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useCreateReview } from "@/hooks/api/use-reviews";
import { Spinner } from "@/components/ui/spinner";

export default function ReviewDialog({ reviewDialog, setReviewDialog, propertyId }: {
  reviewDialog: boolean; setReviewDialog: (open: boolean) => void; propertyId: string;
}) {
  const { t } = useTranslation();
  const createReviewMutation = useCreateReview();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (!reviewText.trim()) { toast.message("Review can't be empty!"); return; }
    if (rating === 0) { toast.message("Please select a rating!"); return; }
    await createReviewMutation.mutateAsync({ content: reviewText, propertyId, rating });
    setReviewText(""); setRating(0); setReviewDialog(false);
  };

  return (
    <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
      <DialogContent className="sm:max-w-lg sm:w-full z-[99999]" style={{ zIndex: 99999 }}>
        <DialogHeader>
          <DialogTitle>{t("propertyDetail.reviewDialogTitle")}</DialogTitle>
          <DialogDescription>{t("propertyDetail.reviewDialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium text-foreground">{t("propertyDetail.yourRating")}</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} size={32}
                    className={`cursor-pointer transition-all duration-200 ${(hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400 scale-110" : "text-muted-foreground"}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)} />
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <span className={`text-base font-semibold ${rating > 0 || hoverRating > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                  {hoverRating || rating || 0}
                </span>
                <span className="text-muted-foreground">/ 5</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="review" className="text-sm font-medium text-foreground">{t("propertyDetail.yourReview")}</Label>
            <Textarea id="review" placeholder={t("propertyDetail.reviewPlaceholder")}
              value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={5} className="max-h-[400px]" />
          </div>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReviewDialog(false)}>{t("propertyDetail.cancelReview")}</Button>
          <Button variant="default" onClick={handleSubmit} disabled={createReviewMutation.isPending}>
            {createReviewMutation.isPending ? <Spinner /> : t("propertyDetail.submitReview")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
