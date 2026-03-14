"use client";

import { useEffect, useMemo, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaStar, FaRegStar } from "react-icons/fa6";

type Review = { user: string; rating: number; date: string; text: string; images?: string[] };

type SubmitPayload = { rating: number; text: string; images: File[]; video?: File | null };
export default function Reviews({
  reviews,
  onSubmit,
}: {
  reviews: Review[];
  onSubmit: (payload: SubmitPayload) => Promise<{ ok: boolean; message?: string }>;
}) {

  const media = useMemo(
    () =>
      reviews.flatMap((r, rIndex) =>
        (r.images || []).map((src, mIndex) => ({ src, review: r, idx: `${rIndex}-${mIndex}` }))
      ),
    [reviews]
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
  const [limit, setLimit] = useState(10);
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    setLimit(isMobile ? 5 : 10);
    const onResize = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setLimit((prev) => (prev <= 5 ? (mobile ? 5 : 10) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sortBy === "high") copy.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "low") copy.sort((a, b) => a.rating - b.rating);
    else copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return copy;
  }, [reviews, sortBy]);
  const visibleReviews = sortedReviews.slice(0, limit);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const go = (dir: 1 | -1) => {
    if (openIdx === null) return;
    const next = (openIdx + dir + media.length) % media.length;
    setOpenIdx(next);
  };

  return (
    <section className="grid p-4 md:p-4 gap-4">
      <h3 className="text-lg font-semibold">Reviews</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 text-[#f59e0b] text-lg">
          {Array.from({ length: 5 }).map((_, i) =>
            i < Math.round(Number(avgRating)) ? <FaStar key={i} /> : <FaRegStar key={i} />
          )}
        </div>
        <div className="text-base font-semibold">{reviews.length} reviews</div>
        <div className="flex gap-2 ml-auto">
          <button
            className="px-4 py-2 rounded-[8px] bg-[#000000] font-semibold text-white text-sm cursor-pointer"
            onClick={() => setFormOpen(true)}
          >
            Write a Review
          </button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 w-full md:w-auto border border-gray-500 rounded-[8px] text-sm bg-white cursor-pointer"
        >
          <option value="recent">Most Recent</option>
          <option value="high">Highest Rating</option>
          <option value="low">Lowest Rating</option>
        </select>
      </div>

      {media.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {media.map((m, i) => (
            <button
              key={m.idx}
              className="w-24 h-24 cursor-pointer rounded-[5px] overflow-hidden border border-black/20 flex-shrink-0"
              onClick={() => setOpenIdx(i)}
            >
              <img src={m.src} alt="review media" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {visibleReviews.length ? (
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(100px,auto)]">
          {visibleReviews.map((r, i) => {
            const hasImage = !!r.images?.length;
            return (
              <div
                key={i}
                className={`border border-black/20 rounded-[6px] p-4 bg-white ${
                  hasImage ? "md:row-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{r.user}</span>
                  <span className="px-2 py-1 rounded-[5px] border border-black bg-black text-white text-xs">
                    {r.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm leading-6 mt-2 text-[var(--ink)]">{r.text}</p>
                {r.images?.length ? (
                  <div className="mt-3">
                    <button
                      className="w-28 h-28 cursor-pointer rounded-[6px] overflow-hidden border border-black/15"
                      onClick={() => {
                        const img = r.images?.[0];
                        const flatIdx = media.findIndex((m) => m.review === r && m.src === img);
                        if (flatIdx >= 0) setOpenIdx(flatIdx);
                      }}
                    >
                      <img src={r.images[0]} alt="review media" className="w-full h-full object-cover" />
                    </button>
                  </div>
                ) : null}
                <p className="text-xs text-[var(--muted)] mt-3">{r.date}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-black/20 rounded-[5px] p-4 bg-white text-sm text-[var(--muted)]">
          No reviews yet. Be the first to share your experience.
        </div>
      )}
      {sortedReviews.length > visibleReviews.length && (
        <div className="flex justify-center">
          <button
            className="btn btn-ghost"
            onClick={() => {
              const isMobile = window.matchMedia("(max-width: 767px)").matches;
              setLimit((prev) => prev + (isMobile ? 5 : 10));
            }}
          >
            Show more
          </button>
        </div>
      )}

      {openIdx !== null && media[openIdx] && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6 animate-backdrop" onClick={() => setOpenIdx(null)}>
          <button
            className="absolute cursor-pointer top-6 right-6 w-11 h-11 rounded-full bg-white shadow border flex items-center justify-center"
            onClick={() => setOpenIdx(null)}
          >
            <IoIosClose size={28} />
          </button>

          <button
            className="absolute cursor-pointer left-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <IoChevronBack size={22} />
          </button>
          <button
            className="absolute cursor-pointer right-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <IoChevronForward size={22} />
          </button>

          <div className="max-w-5xl w-full grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white cursor-pointer rounded-[5px] overflow-hidden max-h-[80vh]">
              <img src={media[openIdx].src} alt="review media" className="w-full h-full object-contain max-h-[80vh]" />
            </div>
            <div className="grid gap-3">
              <div>
                <p className="text-lg font-semibold">{media[openIdx].review.user}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{media[openIdx].review.date}</p>
              </div>
              <p className="text-sm leading-6 text-[var(--ink)]">{media[openIdx].review.text}</p>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center p-6 animate-backdrop" onClick={() => setFormOpen(false)}>
          <div className="max-w-xl w-full bg-white border border-black/20 rounded-[8px] p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Write a Review</h4>
              <button className="w-9 h-9 cursor-pointer rounded-full border flex items-center justify-center" onClick={() => setFormOpen(false)}>
                <IoIosClose size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-medium">How was your experience? (required)</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`w-10 h-10 rounded-full border ${formRating === n ? "bg-black text-white" : "bg-white"} flex items-center justify-center`}
                      onClick={() => setFormRating(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Your review (required)</span>
                <textarea
                  className="input h-28 resize-none"
                  placeholder="Share details about fit, fabric, quality..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Photos (max 2, optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 2);
                    setImgFiles(files);
                  }}
                  className="input"
                />
                <p className="text-xs text-[var(--muted)]">{imgFiles.length}/2 selected</p>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Video (1, optional)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVidFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-[var(--muted)]">{vidFile ? vidFile.name : "No video selected"}</p>
              </div>

              {formMsg && <p className="text-sm text-red-600">{formMsg}</p>}

              <div className="flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
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
      )}
    </section>
  );
}
