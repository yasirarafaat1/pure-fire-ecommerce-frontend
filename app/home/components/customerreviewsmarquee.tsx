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
  rating?: number | string;
  text?: string;
  comment?: string;
  review?: string;
  message?: string;
  images?: string[];
  image?: string;
  photos?: string[];
  review_images?: string[];
};

type Review = {
  id: string;
  user: string;
  rating: number;
  text: string;
  images: string[];
};

const REVIEW_ENDPOINT = "/api/user/reviews?minRating=4&limit=40";

// Temporary mock mode.
// Later when backend endpoint is ready, change this to false.
const USE_MOCK_REVIEWS_ONLY = true;

// Keep this true during development. In production, keep mock reviews disabled.
const USE_MOCK_REVIEWS_FALLBACK = true;

const placeholders = Array.from({ length: 6 }, (_, i) => i);

function makeMockImage(label: string, bg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
      <rect width="720" height="720" fill="${bg}"/>
      <circle cx="360" cy="270" r="120" fill="rgba(255,255,255,0.28)"/>
      <rect x="150" y="430" width="420" height="34" rx="17" fill="rgba(255,255,255,0.42)"/>
      <rect x="210" y="490" width="300" height="24" rx="12" fill="rgba(255,255,255,0.35)"/>
      <text x="360" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111111">${label}</text>
    </svg>
  `)}`;
}

const MOCK_REVIEWS: RawReview[] = [
  {
    id: "mock-1",
    user: "Ayesha",
    rating: 5,
    text: "Fabric quality bahut premium lagi. Fit aur finishing dono expected se better hain.",
    images: [makeMockImage("Review Photo", "#f3e7d3")],
  },
  {
    id: "mock-2",
    user: "Riya",
    rating: 5,
    text: "Color exactly photos jaisa hai. Delivery bhi time par aa gayi.",
  },
  {
    id: "mock-3",
    user: "Neha",
    rating: 4,
    text: "Material soft hai aur stitching clean hai. Overall value for money product.",
    images: [makeMockImage("Customer Look", "#ead7c0")],
  },
  {
    id: "mock-4",
    user: "Sana",
    rating: 5,
    text: "Party wear ke liye perfect laga. Packaging bhi neat thi.",
  },
  {
    id: "mock-5",
    user: "Priya",
    rating: 5,
    text: "Design simple aur classy hai. Lightweight hone ki wajah se comfortable hai.",
    images: [makeMockImage("Premium Fit", "#efe2cf")],
  },
  {
    id: "mock-6",
    user: "Mehak",
    rating: 4,
    text: "Product achcha hai, fabric comfortable hai aur look elegant aata hai.",
  },
  {
    id: "mock-7",
    user: "Kashish",
    rating: 5,
    text: "Mujhe iska color combination bahut pasand aaya. Quality bhi impressive hai.",
  },
  {
    id: "mock-8",
    user: "Anjali",
    rating: 5,
    text: "Occasion wear ke liye kaafi premium feel deta hai. Highly satisfied.",
    images: [makeMockImage("Happy Customer", "#f1dec8")],
  },
];

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getImages(raw: RawReview) {
  const images =
    raw.images ||
    raw.photos ||
    raw.review_images ||
    (raw.image ? [raw.image] : []);

  return Array.isArray(images)
    ? images.filter(
        (src): src is string =>
          typeof src === "string" && src.trim().length > 0,
      )
    : [];
}

function normalizeReview(raw: RawReview, index: number): Review | null {
  const rating = Number(raw.rating || 0);
  const text =
    getString(raw.text) ||
    getString(raw.comment) ||
    getString(raw.review) ||
    getString(raw.message);

  if (!Number.isFinite(rating) || rating < 4) return null;
  if (!text) return null;

  const user =
    getString(raw.user) ||
    getString(raw.name) ||
    getString(raw.customerName) ||
    getString(raw.customer_name) ||
    "Customer";

  return {
    id: String(raw.id || raw._id || raw.review_id || `review-${index}`),
    user,
    rating,
    text,
    images: getImages(raw),
  };
}

function getMockReviews() {
  return MOCK_REVIEWS.map(normalizeReview).filter(
    (review): review is Review => Boolean(review),
  );
}

function extractReviews(payload: any): RawReview[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.data?.reviews)) return payload.data.reviews;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function trimText(text: string, max = 120) {
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export default function CustomerReviewsMarquee() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!seededRef.current) setLoading(true);

      if (USE_MOCK_REVIEWS_ONLY) {
        setReviews(getMockReviews());
        setLoading(false);
        seededRef.current = true;
        return;
      }

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

          if (!seededRef.current && USE_MOCK_REVIEWS_FALLBACK) {
            setReviews(getMockReviews());
            seededRef.current = true;
          }

          return;
        }

        const data = await res.json();

        const freshReviews = extractReviews(data)
          .map(normalizeReview)
          .filter((review): review is Review => Boolean(review));

        if (freshReviews.length) {
          setReviews(freshReviews);
          seededRef.current = true;
        } else if (!seededRef.current && USE_MOCK_REVIEWS_FALLBACK) {
          setReviews(getMockReviews());
          seededRef.current = true;
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Reviews load error:", error);

        if (USE_MOCK_REVIEWS_FALLBACK) {
          setReviews(getMockReviews());
          seededRef.current = true;
        } else {
          setReviews([]);
        }
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
  };

  const openImageReview = (review: Review) => {
    const idx = mediaReviews.findIndex((item) => item.review.id === review.id);
    if (idx >= 0) setOpenIdx(idx);
  };

  const hasReal = reviews.length > 0;

  return (
    <section className="py-5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold border-b border-gray-600">
            Customer Reviews
          </h2>
        </div>
      </div>

      {loading && !hasReal ? (
        <div className="max-w-6xl mx-auto px-4 md:px-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {placeholders.map((item) => (
              <div
                key={item}
                className="border border-black/10 rounded-[6px] bg-white p-4"
              >
                <div className="h-4 w-24 bg-black/5 rounded-[3px] animate-pulse" />
                <div className="h-3 w-full bg-black/5 rounded-[3px] animate-pulse mt-4" />
                <div className="h-3 w-3/4 bg-black/5 rounded-[3px] animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasReal ? (
        <div className="max-w-6xl mx-auto px-4 md:px-2">
          <div className="border border-black/10 rounded-[5px] p-8 text-center text-sm text-[var(--muted)] bg-white">
            No customer reviews yet.
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
              <p className="text-lg font-semibold">
                {mediaReviews[openIdx].review.user}
              </p>
              <p className="text-sm leading-6 text-[var(--ink)]">
                {mediaReviews[openIdx].review.text}
              </p>
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