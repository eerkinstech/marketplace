"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/constants/site";

function Star({ filled, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.95l-5.4 2.84 1.03-6.01-4.36-4.25 6.03-.88L12 3Z" />
    </svg>
  );
}

function renderStars(rating = 0, sizeClass = "h-5 w-5") {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} filled={index < safeRating} className={`${sizeClass} ${index < safeRating ? "text-yellow-400" : "text-slate-300"}`} />
  ));
}

function isReviewApproved(review) {
  if (!review) return false;
  if (review.isApproved === true) return true;
  const status = String(review.status || "").toLowerCase();
  return status === "approved";
}

export function ProductReviews({ product }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [showThanks, setShowThanks] = useState(false);
  const [reviewHover, setReviewHover] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);
  const [requireReviewApproval, setRequireReviewApproval] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    setLocalReviews(Array.isArray(product?.reviews) ? product.reviews : []);
  }, [product]);

  useEffect(() => {
    let ignore = false;

    async function loadLatestReviews() {
      if (!product?.slug) return;

      setIsLoadingReviews(true);

      try {
        const response = await fetch(`${API_URL}/catalog/products/${product.slug}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || ignore) return;

        setLocalReviews(Array.isArray(data?.data?.reviews) ? data.data.reviews : []);
      } catch {
      } finally {
        if (!ignore) setIsLoadingReviews(false);
      }
    }

    loadLatestReviews();

    return () => {
      ignore = true;
    };
  }, [product?.slug]);

  useEffect(() => {
    let ignore = false;

    async function loadReviewSettings() {
      try {
        const response = await fetch(`${API_URL}/catalog/reviews/settings`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || ignore) return;
        setRequireReviewApproval(data?.data?.requireReviewApproval !== false);
      } catch { }
    }

    loadReviewSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const reviewsArr = Array.isArray(localReviews) ? localReviews : [];
  const filteredReviews = useMemo(
    () => reviewsArr.filter(isReviewApproved),
    [reviewsArr]
  );
  const sortedReviews = filteredReviews.slice().sort((a, b) => {
    const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
    const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
    return dateB - dateA;
  });
  const visibleReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 8);
  const totalReviews = filteredReviews.length;
  const hasMoreReviews = totalReviews > 8;
  const averageRating = useMemo(() => {
    if (filteredReviews.length) {
      const sum = filteredReviews.reduce((total, review) => total + Number(review?.rating || 0), 0);
      return sum / filteredReviews.length;
    }

    return Number((product?.ratingAverage ?? product?.rating) || 0);
  }, [filteredReviews, product?.ratingAverage, product?.rating]);

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!reviewEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Review comment is required");
      return;
    }

    if (reviewComment.trim().length < 10) {
      toast.error("Review comment must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/catalog/products/${product?._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          name: reviewName || "Anonymous",
          email: reviewEmail.trim()
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fieldErrors = data?.details ? Object.values(data.details).flat().filter(Boolean) : [];
        throw new Error(fieldErrors[0] || data?.detail || data?.message || "Failed to submit review");
      }

      const createdReview = data?.data || {};
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment("");
      setReviewName("");
      setReviewEmail("");
      setShowThanks(true);

      if (isReviewApproved(createdReview)) {
        setLocalReviews((current) => [createdReview, ...current]);
      }

      toast.success(
        requireReviewApproval
          ? "Review submitted. It will appear after approval."
          : "Review submitted successfully"
      );

      window.setTimeout(() => setShowThanks(false), 3500);
    } catch (error) {
      const errorMsg = error?.message || "Failed to submit review";
      if (
        errorMsg.includes("already submitted") ||
        errorMsg.includes("Only one review") ||
        errorMsg.includes("already added") ||
        errorMsg.includes("duplicate") ||
        errorMsg.includes("already submitted a review")
      ) {
        toast.error("You have already added a review with this email. Only one review per product per email is allowed.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_12px_32px_rgba(16,32,26,0.05)] sm:p-8">
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Customer Reviews & Ratings</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {requireReviewApproval
          ? "Submit a review and it will appear after admin approval."
          : "Submit a review to add it to the product page immediately."}
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="rounded-[20px] border border-black/8 bg-[#f8f5ef] p-6 text-center">
          <div className="text-3xl font-bold text-ink">{averageRating.toFixed(1)}</div>
          <div className="mt-4 flex justify-center gap-1">
            {renderStars(averageRating, "h-8 w-8")}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Based on {totalReviews} verified reviews
          </p>
        </div>

        <div className="space-y-4 md:col-span-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = filteredReviews.filter((review) => Math.round(Number(review?.rating || 0)) === stars).length;
            const percent = totalReviews ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-4">
                <span className="w-16 text-sm font-semibold text-slate-700">{stars} Star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-ink transition-all" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-12 text-sm font-semibold text-slate-500">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 border-t border-black/8 pt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-ink sm:text-2xl">Recent Reviews</h3>
          <button
            type="button"
            onClick={() => setShowReviewForm((state) => !state)}
            className="rounded-[14px] bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 sm:px-5"
          >
            {showReviewForm ? "Cancel" : "Write a review"}
          </button>
        </div>

        {showThanks ? (
          <div className="mb-4 rounded-[16px] border border-black/8 bg-[#f8f5ef] p-4 text-sm text-ink">
            {requireReviewApproval
              ? "Thank you. Your review has been submitted and is waiting for approval."
              : "Thank you. Your review has been submitted."}
          </div>
        ) : null}

        {showReviewForm ? (
          <form onSubmit={handleSubmitReview} className="mb-6 rounded-[20px] bg-[#f8f5ef] p-6">
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Your Rating</label>
                <div className="mt-2 flex items-center gap-2" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const filled = value <= (reviewHover || reviewRating);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        onMouseEnter={() => setReviewHover(value)}
                        onMouseLeave={() => setReviewHover(0)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setReviewRating(value);
                          }
                        }}
                        aria-checked={reviewRating === value}
                        role="radio"
                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                        className={`text-2xl ${filled ? "text-yellow-500" : "text-slate-300"}`}
                      >
                        <Star filled={filled} className={`h-5 w-5 ${filled ? "text-yellow-400" : "text-slate-300"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Your Name (Optional)</label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(event) => setReviewName(event.target.value)}
                  placeholder="Enter your name or leave blank"
                  className="field-input mt-2 h-12 w-full rounded-[14px] border border-black/10 bg-white px-4"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Your Email <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={reviewEmail}
                  onChange={(event) => setReviewEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                  className="field-input mt-2 h-12 w-full rounded-[14px] border border-black/10 bg-white px-4"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700">Your Review</label>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={4}
                placeholder="Share your experience with this product..."
                className="field-input mt-2 w-full rounded-[14px] border border-black/10 bg-white px-4 py-3"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`rounded-[14px] px-6 py-3 font-semibold ${isSubmitting ? "bg-slate-300 text-white" : "bg-black text-white hover:bg-black/90"}`}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="space-y-6">
          {isLoadingReviews ? (
            <div className="rounded-[18px] border border-black/8 bg-[#fcfaf7] p-8 text-center">
              <p className="font-semibold text-slate-600">Loading reviews...</p>
            </div>
          ) : null}

          {visibleReviews.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {visibleReviews.map((review, index) => {
                const reviewKey = review?._id || `${review?.guestEmail || review?.email || "review"}-${index}`;
                const userName = review?.guestName || review?.name || review?.user?.name || "Customer";
                const userEmail = review?.guestEmail || review?.email || review?.user?.email || "";
                const rating = Number(review?.rating || 0);
                const comment = review?.comment || "";
                const reviewDate = new Date(review?.createdAt || review?.updatedAt || Date.now());
                const dateString = reviewDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                });

                return (
                  <div key={reviewKey} className="rounded-[18px] border border-black/8 bg-[#fcfaf7] p-5 transition hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{userName}</p>
                        {userEmail ? <p className="truncate text-xs text-slate-500">{userEmail}</p> : null}
                        <span className="mt-1 inline-block rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {dateString}
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-xs">{renderStars(rating, "h-4 w-4")}</div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">{comment}</p>
                  </div>
                );
              })}
            </div>
          ) : !isLoadingReviews ? (
            <div className="rounded-[18px] border border-black/8 bg-[#fcfaf7] p-8 text-center">
              <p className="font-semibold text-slate-600">No reviews yet</p>
              <p className="mt-2 text-sm text-slate-500">Be the first to share your experience with this product.</p>
            </div>
          ) : null}

          {hasMoreReviews ? (
            <div className="flex justify-center border-t border-black/8 pt-6">
              <button
                type="button"
                onClick={() => setShowAllReviews((state) => !state)}
                className="rounded-[14px] bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                {showAllReviews ? "Show fewer reviews" : `Show all ${totalReviews} reviews`}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
