import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ReviewDialog from "./review-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useGetReviewsQuery } from "@/hooks/api/use-reviews";
import { Spinner } from "@/components/ui/spinner";
import ReviewCard from "./review-card";

const ReviewsContainer = ({ propertyId }: { propertyId: string }) => {
  const { t } = useTranslation();
  const [reviewDialog, setReviewDialog] = useState(false);
  const dataQuery = useGetReviewsQuery({ propertyId });

  const renderData = () => {
    if (dataQuery.isLoading) return <div className="py-20 flex justify-center items-center"><Spinner /></div>;
    if (dataQuery.error || !dataQuery.data?.success) return (
      <div className="py-20 flex justify-center items-center">
        <h2>{t("propertyDetail.reviewsError")}</h2>
      </div>
    );
    if (dataQuery.data?.data.length === 0) return (
      <EmptyState
        title={t("propertyDetail.noReviewsYet")}
        description={t("propertyDetail.noReviewsDesc")}
        primaryActions={
          <Button onClick={() => setReviewDialog(true)}>{t("propertyDetail.writeReview")}</Button>
        }
      />
    );
    if (dataQuery.data?.data) return (
      <div className="w-full grid grid-cols-1 gap-3">
        {dataQuery.data.data.map((review) => <ReviewCard key={review.id} review={review} />)}
      </div>
    );
  };

  return (
    <>
      <div className="pt-8 flex flex-col gap-4 pb-24">
        <header className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-semibold">{t("propertyDetail.guestReviews")}</h2>
          <Button variant="outline" size="sm" onClick={() => setReviewDialog(true)}>
            {t("propertyDetail.writeReview")}
          </Button>
        </header>
        <div>{renderData()}</div>
      </div>
      <ReviewDialog reviewDialog={reviewDialog} setReviewDialog={setReviewDialog} propertyId={propertyId} />
    </>
  );
};

export default ReviewsContainer;
