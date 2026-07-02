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

const formatReviewDate = (value: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
      reviews.flatMap((r, rIndex) =>
        (r.images || []).map((src, mIndex) => ({
          src,
          review: r,
          idx: `${rIndex}-${mIndex}`,
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

  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : "0.0";

  const go = (dir: 1 | -1) =>
    openIdx !== null && setOpenIdx((openIdx + dir + media.length) % media.length);

  return (
    <section className="grid gap-4 p-4 md:p-4">
      <div className="flex items-center justify-between">
        <h3 className="border-b border-gray-600 text-lg font-semibold">
          {title}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 text-lg text-[#f59e0b]">
          {Array.from({ length: 5 }).map((_, i) =>
            i < Math.round(Number(avgRating)) ? (
              <FaStar key={i} />
            ) : (
              <FaRegStar key={i} />
            ),
          )}
        </div>

        <div className="text-base font-semibold">{reviews.length} reviews</div>

        {canWrite ? (
          <div className="ml-auto flex gap-2">
            <button
              className="cursor-pointer rounded-[8px] bg-[#000000] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setFormOpen(true)}
            >
              Write a Review
            </button>
          </div>
        ) : null}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full cursor-pointer rounded-[8px] border border-gray-500 bg-white px-3 py-2 text-sm md:w-auto"
        >
          <option value="recent">Most Recent</option>
          <option value="high">Highest Rating</option>
          <option value="low">Lowest Rating</option>
        </select>
      </div>

      {media.length > 0 ? (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-3">
          {media.map((m, i) => (
            <button
              key={m.idx}
              className="h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-[5px] border border-black/20"
              onClick={() => setOpenIdx(i)}
            >
              <img
                src={m.src}
                alt="review media"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {visibleReviews.length ? (
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(100px,auto)]">
          {visibleReviews.map((r, i) => {
            const hasImage = !!r.images?.length;
            const firstImage = r.images?.[0];

            return (
              <div
                key={i}
                className={`rounded-[6px] border border-black/20 bg-white p-4 ${
                  hasImage ? "md:row-span-1" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-medium">
                  <span className="min-w-0 truncate">{r.user}</span>

                  <span className="rounded-[5px] border border-amber-500 bg-amber-500 px-2 py-1 text-xs text-white">
                    {r.rating.toFixed(1)}
                  </span>
                </div>

                {hasImage && firstImage ? (
                  <div className="mt-3 grid grid-cols-[112px_minmax(0,1fr)] gap-3">
                    <button
                      className="h-28 w-28 cursor-pointer overflow-hidden rounded-[6px] border border-black/15"
                      onClick={() => {
                        const flatIdx = media.findIndex(
                          (m) => m.review === r && m.src === firstImage,
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
                        {trimText(r.text || "", 120)}
                      </p>

                      <p className="text-xs font-semibold text-[var(--muted)]">
                        {formatReviewDate(r.date)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <p className="mt-2 break-words text-sm leading-6 text-[var(--ink)]">
                      {trimText(r.text || "")}
                    </p>

                    <p className="mt-3 text-xs text-[var(--muted)]">
                      {formatReviewDate(r.date)}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6 animate-backdrop"
          onClick={() => setOpenIdx(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border bg-white shadow"
            onClick={() => setOpenIdx(null)}
          >
            <IoIosClose size={28} />
          </button>

          <button
            className="absolute left-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border bg-white/90 shadow"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <IoChevronBack size={22} />
          </button>

          <button
            className="absolute right-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border bg-white/90 shadow"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <IoChevronForward size={22} />
          </button>

          <div
            className="grid w-full max-w-5xl items-center gap-6 animate-pop md:grid-cols-[1.1fr_0.9fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[80vh] cursor-pointer overflow-hidden rounded-[5px] bg-white">
              <img
                src={media[openIdx].src}
                alt="review media"
                className="max-h-[80vh] h-full w-full object-contain"
              />
            </div>

            <div className="grid gap-3">
              <div>
                <p className="text-lg font-semibold">
                  {media[openIdx].review.user}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatReviewDate(media[openIdx].review.date)}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6 animate-backdrop"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-[8px] border border-black/20 bg-white p-6 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Write a Review</h4>

              <button
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border"
                onClick={() => setFormOpen(false)}
              >
                <IoIosClose size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-medium">
                  How was your experience? (required)
                </span>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        formRating === n ? "bg-black text-white" : "bg-white"
                      }`}
                      onClick={() => setFormRating(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
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
                  onChange={(e) => setFormText(e.target.value)}
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
                  onChange={(e) =>
                    setImgFiles(Array.from(e.target.files || []).slice(0, 2))
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
                  onChange={(e) => setVidFile(e.target.files?.[0] || null)}
                  className="input"
                />

                <p className="text-xs text-[var(--muted)]">
                  {vidFile ? vidFile.name : "No video selected"}
                </p>
              </div>

              {formMsg ? <p className="text-sm text-red-600">{formMsg}</p> : null}

              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>

                <button
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
                      rating: formRating,
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
        </div>
      ) : null}
    </section>
  );
}