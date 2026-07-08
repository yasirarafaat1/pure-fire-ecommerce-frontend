"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IoIosClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaStar, FaRegStar } from "react-icons/fa6";

type Review = {
  user: string;
  rating: number;
  date: string;
  text: string;
  images?: string[];
};

type SubmitPayload = {
  rating: number;
  text: string;
  images: File[];
  video?: File | null;
};

const maxReviewChars = 90;

const trimText = (text: string, max = 90) =>
  text && text.length > max ? `${text.slice(0, max).trim()}...` : text;

const normalizeRating = (value: number) => {
  const rating = Math.trunc(Number(value || 0));

  if (Number.isNaN(rating)) return 0;

  return Math.max(0, Math.min(5, rating));
};

const formatReviewDateTime = (value: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRatingBadgeClass = (rating: number) => {
  const safeRating = normalizeRating(rating);

  if (safeRating <= 1) return "border-red-200 bg-red-50 text-red-700";
  if (safeRating <= 3) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const getRatingButtonClass = (rating: number) => {
  const safeRating = normalizeRating(rating);

  if (safeRating <= 1) {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (safeRating <= 3) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
};

function RatingStars({
  rating,
  className = "",
  starClassName = "",
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  const safeRating = normalizeRating(rating);

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {safeRating > 0 ? (
        <FaStar className={starClassName} />
      ) : (
        <FaRegStar className={starClassName} />
      )}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const safeRating = normalizeRating(rating);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border px-2 py-1 text-xs font-black ${getRatingBadgeClass(
        safeRating,
      )}`}
    >
      <span>{safeRating}</span>
      <RatingStars rating={safeRating} starClassName="text-[10px]" />
    </span>
  );
}

export default function Reviews({
  title,
  reviews,
  onSubmit,
}: {
  title: string;
  reviews: Review[];
  onSubmit: (payload: SubmitPayload) => Promise<{ ok: boolean; message?: string }>;
}) {
  const media = useMemo(
    () =>
      reviews.flatMap((review, reviewIndex) =>
        (review.images || []).map((src, mediaIndex) => ({
          src,
          review,
          idx: `${reviewIndex}-${mediaIndex}`,
        })),
      ),
    [reviews],
  );

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "high" | "low">("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [vidFile, setVidFile] = useState<File | null>(null);
  const [formMsg, setFormMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const canWrite = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};

      const handler = () => onStoreChange();

      window.addEventListener("storage", handler);
      window.addEventListener("auth:updated", handler as EventListener);

      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("auth:updated", handler as EventListener);
      };
    },
    () =>
      typeof window !== "undefined"
        ? !!localStorage.getItem("user_token")
        : false,
    () => false,
  );

  const isMobile = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};

      const mq = window.matchMedia("(max-width: 767px)");
      const handler = () => onStoreChange();

      if (mq.addEventListener) mq.addEventListener("change", handler);
      else mq.addListener(handler);

      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else mq.removeListener(handler);
      };
    },
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(max-width: 767px)").matches
        : false,
    () => false,
  );

  useEffect(() => {
    if (!formOpen && openIdx === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setFormOpen(false);
      setOpenIdx(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [formOpen, openIdx]);

  const baseLimit = isMobile ? 5 : 10;
  const limit = baseLimit * page;

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];

    if (sortBy === "high") copy.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "low") copy.sort((a, b) => a.rating - b.rating);
    else
      copy.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

    return copy;
  }, [reviews, sortBy]);

  const visibleReviews = sortedReviews.slice(0, limit);

  const avgRatingNumber = reviews.length
    ? normalizeRating(
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length,
      )
    : 0;

  const go = (dir: 1 | -1) => {
    if (openIdx === null || media.length === 0) return;

    setOpenIdx((openIdx + dir + media.length) % media.length);
  };

  const openReviewForm = () => {
    setFormMsg("");
    setFormOpen(true);
  };

  const closeReviewForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setFormMsg("");
  };

  return (
    <section className="grid gap-4 p-4 md:p-4">
      <div className="flex items-center justify-between">
        <h3 className="border-b border-gray-600 text-lg font-semibold">
          {title}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <RatingStars
            rating={avgRatingNumber}
            className="text-lg text-[#f59e0b]"
          />

          <span className="text-sm font-black text-[var(--ink)]">
            {avgRatingNumber}/5
          </span>
        </div>

        <div className="text-base font-semibold">{reviews.length} reviews</div>

        {canWrite ? (
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-[8px] bg-[#000000] px-4 py-2 text-sm font-semibold text-white"
              onClick={openReviewForm}
            >
              Write a Review
            </button>
          </div>
        ) : null}

        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as "recent" | "high" | "low");
            setPage(1);
          }}
          className="w-full cursor-pointer rounded-[8px] border border-gray-500 bg-white px-3 py-2 text-sm md:w-auto"
        >
          <option value="recent">Most Recent</option>
          <option value="high">Highest Rating</option>
          <option value="low">Lowest Rating</option>
        </select>
      </div>

      {media.length > 0 ? (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-3">
          {media.map((item, index) => (
            <button
              key={item.idx}
              type="button"
              className="h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-[5px] border border-black/20 bg-white"
              onClick={() => setOpenIdx(index)}
            >
              <img
                src={item.src}
                alt="review media"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {visibleReviews.length ? (
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(100px,auto)]">
          {visibleReviews.map((review, index) => {
            const hasImage = !!review.images?.length;
            const firstImage = review.images?.[0];

            return (
              <div
                key={index}
                className="rounded-[6px] border border-black/20 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3 text-sm font-medium">
                  <span className="min-w-0 truncate">{review.user}</span>
                  <RatingBadge rating={review.rating} />
                </div>

                {hasImage && firstImage ? (
                  <div className="mt-3 grid grid-cols-[112px_minmax(0,1fr)] gap-3">
                    <button
                      type="button"
                      className="h-28 w-28 cursor-pointer overflow-hidden rounded-[6px] border border-black/15 bg-white"
                      onClick={() => {
                        const flatIdx = media.findIndex(
                          (item) =>
                            item.review === review && item.src === firstImage,
                        );

                        if (flatIdx >= 0) setOpenIdx(flatIdx);
                      }}
                    >
                      <img
                        src={firstImage}
                        alt="review media"
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div className="flex min-w-0 flex-col justify-between gap-2">
                      <p className="line-clamp-4 break-words text-sm leading-6 text-[var(--ink)]">
                        {trimText(review.text || "", 120)}
                      </p>

                      <p className="text-xs font-semibold text-[var(--muted)]">
                        {formatReviewDateTime(review.date)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    <p className="break-words text-sm leading-6 text-[var(--ink)]">
                      {trimText(review.text || "")}
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      {formatReviewDateTime(review.date)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[5px] border border-black/20 bg-white p-4 text-sm text-[var(--muted)]">
          No reviews yet. Be the first to share your experience.
        </div>
      )}

      {sortedReviews.length > visibleReviews.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPage((prev) => prev + 1);
            }}
          >
            Show more
          </button>
        </div>
      ) : null}

      {openIdx !== null && media[openIdx] ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white p-3 animate-backdrop sm:p-6"
          onClick={() => setOpenIdx(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border bg-white shadow sm:right-6 sm:top-6"
            onClick={(event) => {
              event.stopPropagation();
              setOpenIdx(null);
            }}
          >
            <IoIosClose size={28} />
          </button>

          {media.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white/90 shadow sm:left-6 sm:h-11 sm:w-11"
                onClick={(event) => {
                  event.stopPropagation();
                  go(-1);
                }}
              >
                <IoChevronBack size={22} />
              </button>

              <button
                type="button"
                className="absolute right-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white/90 shadow sm:right-6 sm:h-11 sm:w-11"
                onClick={(event) => {
                  event.stopPropagation();
                  go(1);
                }}
              >
                <IoChevronForward size={22} />
              </button>
            </>
          ) : null}

          <div
            className="grid max-h-[92vh] w-full max-w-5xl gap-5 overflow-y-auto rounded-[8px] bg-white p-2 animate-pop md:grid-cols-[1.1fr_0.9fr] md:items-center md:overflow-hidden md:p-0"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex max-h-[58vh] cursor-pointer items-center justify-center overflow-hidden rounded-[5px] bg-white md:max-h-[82vh]">
              <img
                src={media[openIdx].src}
                alt="review media"
                className="max-h-[58vh] w-full object-contain md:max-h-[82vh]"
              />
            </div>

            <div className="grid gap-3 rounded-[8px] border border-black/10 bg-white p-4 md:border-0 md:p-0">
              <div>
                <p className="text-lg font-semibold">
                  {media[openIdx].review.user}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RatingBadge rating={media[openIdx].review.rating} />
                </div>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatReviewDateTime(media[openIdx].review.date)}
                </p>
              </div>

              <p className="text-sm leading-6 text-[var(--ink)]">
                {media[openIdx].review.text}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-3 animate-backdrop sm:p-6"
          onClick={closeReviewForm}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[8px] border border-black/20 bg-white animate-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-4">
              <h4 className="text-lg font-semibold">Write a Review</h4>

              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border"
                onClick={closeReviewForm}
                disabled={submitting}
              >
                <IoIosClose size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium">
                    How was your experience? (required)
                  </span>

                  <div
                    className={`flex w-fit gap-2 rounded-[10px] border p-2 transition ${getRatingButtonClass(
                      formRating || 3,
                    )}`}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const selected = formRating >= rating;

                      return (
                        <button
                          key={rating}
                          type="button"
                          className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
                            selected
                              ? "border-current bg-white/70 text-current"
                              : "border-black/10 bg-white text-slate-300 hover:text-[#f59e0b]"
                          }`}
                          onClick={() => {
                            setFormRating(rating);
                            setFormMsg("");
                          }}
                          aria-label={`Select ${rating} star rating`}
                        >
                          {selected ? <FaStar /> : <FaRegStar />}
                        </button>
                      );
                    })}
                  </div>

                  {formRating ? (
                    <p
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${getRatingBadgeClass(
                        formRating,
                      )}`}
                    >
                      Selected rating: {normalizeRating(formRating)}/5
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-medium">
                    Your review (required)
                  </span>

                  <textarea
                    className="input h-28 resize-none"
                    placeholder="Share details about fit, fabric, quality..."
                    value={formText}
                    maxLength={maxReviewChars}
                    onChange={(event) => setFormText(event.target.value)}
                  />

                  <p className="text-xs text-[var(--muted)]">
                    {formText.length}/{maxReviewChars} characters
                  </p>
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-medium">
                    Photos (max 2, optional)
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setImgFiles(Array.from(event.target.files || []).slice(0, 2))
                    }
                    className="input"
                  />

                  <p className="text-xs text-[var(--muted)]">
                    {imgFiles.length}/2 selected
                  </p>
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-medium">Video (1, optional)</span>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) => setVidFile(event.target.files?.[0] || null)}
                    className="input"
                  />

                  <p className="text-xs text-[var(--muted)]">
                    {vidFile ? vidFile.name : "No video selected"}
                  </p>
                </div>

                {formMsg ? (
                  <p className="rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {formMsg}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-black/10 bg-white px-5 py-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeReviewForm}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={async () => {
                  if (!formRating || !formText.trim()) {
                    setFormMsg("Please add rating and review text.");
                    return;
                  }

                  if (imgFiles.length > 2) {
                    setFormMsg("Max 2 images allowed.");
                    return;
                  }

                  setSubmitting(true);

                  const res = await onSubmit({
                    rating: normalizeRating(formRating),
                    text: formText.trim(),
                    images: imgFiles,
                    video: vidFile,
                  });

                  setSubmitting(false);

                  if (!res.ok) {
                    setFormMsg(res.message || "Failed to submit review.");
                    return;
                  }

                  setFormMsg("");
                  setFormOpen(false);
                  setFormRating(0);
                  setFormText("");
                  setImgFiles([]);
                  setVidFile(null);
                }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
