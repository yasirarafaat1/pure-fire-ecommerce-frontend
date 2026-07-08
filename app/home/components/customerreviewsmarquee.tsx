"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cachedFetch, getCachedJson } from "../../utils/cachedFetch";
import { IoIosClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

type RawReview = {
  id?: string | number;
  _id?: string | number;
  review_id?: string | number;
  user?: string;
  name?: string;
  customerName?: string;
  customer_name?: string;
  user_name?: string;
  rating?: number | string;
  review_rate?: number | string;
  text?: string;
  comment?: string;
  review_text?: string;
  review?: string;
  message?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  review_date?: string;
  images?: string[];
  image?: string;
  review_image?: string;
  photos?: string[];
  review_images?: string[];
};

type Review = {
  id: string;
  user: string;
  rating: number;
  text: string;
  date: string;
  images: string[];
};

const MIN_REVIEW_RATING = 3;
const REVIEW_ENDPOINT = `/api/user/reviews?minRating=${MIN_REVIEW_RATING}&limit=40`;

const placeholders = Array.from({ length: 6 }, (_, i) => i);

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getImages(raw: RawReview) {
  const candidates = [
    ...(Array.isArray(raw.images) ? raw.images : []),
    ...(Array.isArray(raw.photos) ? raw.photos : []),
    ...(Array.isArray(raw.review_images) ? raw.review_images : []),
    raw.review_image,
    raw.image,
  ];

  return candidates.filter(
    (src): src is string =>
      typeof src === "string" && src.trim().length > 0,
  );
}

function normalizeReview(raw: RawReview, index: number): Review | null {
  const rating = Number(raw.review_rate || raw.rating || 0);
  const text =
    getString(raw.review_text) ||
    getString(raw.text) ||
    getString(raw.comment) ||
    getString(raw.review) ||
    getString(raw.message);

  if (!Number.isFinite(rating) || rating < MIN_REVIEW_RATING) return null;
  if (!text) return null;

  const user =
    getString(raw.user) ||
    getString(raw.user_name) ||
    getString(raw.name) ||
    getString(raw.customerName) ||
    getString(raw.customer_name) ||
    "Customer";

  return {
    id: String(raw.id || raw._id || raw.review_id || `review-${index}`),
    user,
    rating,
    text,
    date:
      getString(raw.review_date) ||
      getString(raw.date) ||
      getString(raw.createdAt) ||
      getString(raw.updatedAt),
    images: getImages(raw),
  };
}

function extractReviews(payload: unknown): RawReview[] {
  if (Array.isArray(payload)) return payload as RawReview[];
  if (!payload || typeof payload !== "object") return [];
  const data = payload as { reviews?: RawReview[]; data?: RawReview[] | { reviews?: RawReview[] } };
  if (Array.isArray(data.reviews)) return data.reviews;
  if (data.data && !Array.isArray(data.data) && Array.isArray(data.data.reviews)) return data.data.reviews;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function trimText(text: string, max = 120) {
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function formatReviewDateTime(value: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRatingTone(rating: number) {
  if (rating <= 1.5) return "review-rating-red";
  if (rating < 4) return "review-rating-yellow";
  return "review-rating-green";
}

export default function CustomerReviewsMarquee() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [modalMotionKey, setModalMotionKey] = useState(0);
  const seededRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!seededRef.current) setLoading(true);

      try {
        const cached = getCachedJson(REVIEW_ENDPOINT);
        const cachedReviews = extractReviews(cached)
          .map(normalizeReview)
          .filter((review): review is Review => Boolean(review));

        if (cachedReviews.length) {
          setReviews(cachedReviews);
          setLoading(false);
          seededRef.current = true;
        }

        const res = await cachedFetch(REVIEW_ENDPOINT, undefined, 600000, true);

        if (!res.ok) {
          console.error("Reviews API failed:", res.status, REVIEW_ENDPOINT);
          if (!seededRef.current) setReviews([]);
          return;
        }

        const data = await res.json();

        const freshReviews = extractReviews(data)
          .map(normalizeReview)
          .filter((review): review is Review => Boolean(review));

        setReviews(freshReviews);
        seededRef.current = freshReviews.length > 0;
      } catch (error) {
        console.error("Reviews load error:", error);
        if (!seededRef.current) setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const mediaReviews = useMemo(
    () =>
      reviews
        .filter((review) => review.images.length > 0)
        .map((review) => ({
          src: review.images[0],
          review,
        })),
    [reviews],
  );

  const marqueeItems = useMemo(() => {
    if (!reviews.length) return [];
    return [...reviews, ...reviews];
  }, [reviews]);

  const go = (dir: 1 | -1) => {
    if (openIdx === null || !mediaReviews.length) return;
    setOpenIdx((openIdx + dir + mediaReviews.length) % mediaReviews.length);
    setModalMotionKey((key) => key + 1);
  };

  const openImageReview = (review: Review) => {
    const idx = mediaReviews.findIndex((item) => item.review.id === review.id);
    if (idx >= 0) {
      setOpenIdx(idx);
      setModalMotionKey((key) => key + 1);
    }
  };

  const hasReal = reviews.length > 0;

  if (!loading && !hasReal) return null;

  return (
    <section className="min-h-[210px] py-5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold border-b border-gray-600">
            Customer Reviews
          </h2>
        </div>
      </div>

      {loading && !hasReal ? (
        <div className="reviews-marquee-wrap">
          <div className="reviews-marquee-track reviews-marquee-track-skeleton">
            {[...placeholders, ...placeholders].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={`reviews-marquee-card ${
                  index % 3 === 0 ? "reviews-marquee-card-image" : ""
                }`}
              >
                <div className="h-4 w-24 bg-black/10 rounded-[3px] animate-pulse" />
                {index % 3 === 0 ? (
                  <div className="review-image-row">
                    <div className="review-image-button rounded-[6px] bg-black/10 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-full bg-black/10 rounded-[3px] animate-pulse" />
                      <div className="h-3 w-4/5 bg-black/10 rounded-[3px] animate-pulse mt-2" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="h-3 w-full bg-black/10 rounded-[3px] animate-pulse" />
                    <div className="h-3 w-5/6 bg-black/10 rounded-[3px] animate-pulse mt-2" />
                    <div className="h-3 w-2/3 bg-black/10 rounded-[3px] animate-pulse mt-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="reviews-marquee-wrap">
          <div className="reviews-marquee-track">
            {marqueeItems.map((review, index) => {
              const hasImage = review.images.length > 0;

              return (
                <article
                  key={`${review.id}-${index}`}
                  className={`reviews-marquee-card ${
                    hasImage ? "reviews-marquee-card-image" : ""
                  }`}
                >
                  <p className="review-user text-sm font-semibold text-black">
                    {review.user}
                  </p>

                  {hasImage ? (
                    <div className="review-image-row">
                      <button
                        type="button"
                        className="review-image-button rounded-[6px] overflow-hidden border border-black/10 bg-black/5 flex-shrink-0 cursor-pointer"
                        onClick={() => openImageReview(review)}
                        aria-label="Open review image"
                      >
                        <img
                          src={review.images[0]}
                          alt="Customer review"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>

                      <p className="review-text text-sm leading-6 text-[var(--ink)] break-words">
                        {trimText(review.text, 92)}
                      </p>
                    </div>
                  ) : (
                    <p className="review-text text-sm leading-6 text-[var(--ink)] mt-2 break-words">
                      {trimText(review.text, 118)}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {openIdx !== null && mediaReviews[openIdx] && (
        <div
          className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6 animate-backdrop"
          onClick={() => setOpenIdx(null)}
        >
          <button
            type="button"
            className="absolute cursor-pointer top-6 right-6 w-11 h-11 rounded-full bg-white shadow border flex items-center justify-center"
            onClick={() => setOpenIdx(null)}
            aria-label="Close review image"
          >
            <IoIosClose size={28} />
          </button>

          {mediaReviews.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute cursor-pointer left-4 md:left-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous review image"
              >
                <IoChevronBack size={22} />
              </button>

              <button
                type="button"
                className="absolute cursor-pointer right-4 md:right-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next review image"
              >
                <IoChevronForward size={22} />
              </button>
            </>
          ) : null}

          <div
            key={modalMotionKey}
            className="max-w-5xl w-full grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white cursor-pointer rounded-[5px] overflow-hidden max-h-[80vh]">
              <img
                src={mediaReviews[openIdx].src}
                alt="Customer review"
                className="w-full h-full object-contain max-h-[80vh]"
              />
            </div>

            <div className="grid gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">
                    {mediaReviews[openIdx].review.user}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-[var(--ink)]">
                {mediaReviews[openIdx].review.text}
              </p>
                {mediaReviews[openIdx].review.date ? (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatReviewDateTime(mediaReviews[openIdx].review.date)}
                  </p>
                ) : null}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reviews-marquee-wrap {
          width: 100%;
          overflow: hidden;
          padding: 0 0 4px;
        }

        .reviews-marquee-track {
          display: flex;
          width: max-content;
          gap: 12px;
          animation: reviews-marquee-left 42s linear infinite;
          will-change: transform;
        }

        .reviews-marquee-wrap:hover .reviews-marquee-track {
          animation-play-state: paused;
        }

        .reviews-marquee-card {
          width: 300px;
          min-height: 132px;
          border: 1px solid rgba(0, 0, 0, 0.16);
          border-radius: 6px;
          background: #ffffff;
          padding: 16px;
          flex-shrink: 0;
        }

        .reviews-marquee-card-image {
          min-height: 132px;
        }

        .review-image-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        .review-image-button {
          width: 88px;
          height: 88px;
        }

        .review-rating-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
        }

        .review-rating-red {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .review-rating-yellow {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .review-rating-green {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        @keyframes reviews-marquee-left {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 767px) {
          .reviews-marquee-track {
            gap: 10px;
            animation-duration: 34s;
          }

          .reviews-marquee-card {
            width: 218px;
            min-height: 96px;
            padding: 10px;
          }

          .reviews-marquee-card-image {
            min-height: 112px;
          }

          .review-user {
            font-size: 12px;
            line-height: 16px;
          }

          .review-text {
            font-size: 12px;
            line-height: 18px;
          }

          .review-image-row {
            gap: 9px;
            margin-top: 7px;
          }

          .review-image-button {
            width: 58px;
            height: 58px;
            border-radius: 5px;
          }
        }

        @media (max-width: 380px) {
          .reviews-marquee-card {
            width: 202px;
          }

          .review-image-button {
            width: 54px;
            height: 54px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reviews-marquee-track {
            animation: none;
            overflow-x: auto;
            width: auto;
          }
        }
      `}</style>
    </section>
  );
}
