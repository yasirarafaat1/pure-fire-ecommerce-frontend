"use client";

import { useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Review = {
  _id: string;
  product_id: number;
  product?: { name?: string };
  rating: number;
  user?: string;
  review_title?: string;
  comment?: string;
  status?: string;
  createdAt?: string;
};

const clampRating = (rating: number) =>
  Math.max(0, Math.min(5, Math.round(rating || 0)));

const formatDate = (value?: string) => {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ReviewsPage() {
  const list = useAdminList<Review>("/reviews");
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState("");

  const remove = async () => {
    if (!deleting || deleteBusy) return;

    setDeleteBusy(true);
    setMessage("");

    try {
      await adminApi.delete(`/reviews/${deleting._id}`);

      const deletedId = deleting._id;

      setDeleting(null);
      setMessage("Review deleted successfully.");
      list.setItems((current) =>
        current.filter((review) => review._id !== deletedId),
      );

      await list.refresh();
    } catch (error) {
      setMessage(
        error instanceof AdminApiError ? error.message : "Delete failed",
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Reviews"
        description="Find and delete customer product reviews when cleanup is required."
      />

      <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-950">
              Customer reviews
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Manage product reviews in table view.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="relative w-full lg:w-[360px]">
              <Search
                size={16}
                strokeWidth={2.4}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className="h-10 w-full rounded-[4px] border border-slate-300 bg-white pl-9 pr-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/5"
                placeholder="Search customer, product or review"
                value={String(list.filters.q || "")}
                onChange={(event) =>
                  list.updateFilters({ q: event.target.value })
                }
              />
            </label>

            {String(list.filters.q || "").trim() ? (
              <button
                type="button"
                className="h-10 rounded-[4px] border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 active:scale-[0.98]"
                onClick={() => list.updateFilters({ q: "" })}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {message ? (
          <div
            className={`border-b px-4 py-2 text-sm font-semibold ${message.toLowerCase().includes("failed") ||
                message.toLowerCase().includes("error")
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
          >
            {message}
          </div>
        ) : null}

        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState
            title="No reviews found"
            description="Change search keyword or review filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    Review
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {list.items.map((review) => {
                  const rating = clampRating(review.rating);
                  const productName =
                    review.product?.name || `Product #${review.product_id}`;

                  return (
                    <tr
                      key={review._id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="max-w-[160px] px-4 py-4 align-top">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {review.user || "Anonymous"}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-4 py-4 align-top">
                        <p className="truncate text-sm font-black text-slate-950">
                          {productName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          ID: {review.product_id}
                        </p>
                      </td>

                      <td className="max-w-[340px] px-4 py-4 align-top">
                        <p className="truncate text-sm font-black text-slate-950">
                          {review.review_title || "Review"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-slate-600">
                          {review.comment || "No comment"}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div
                          className="flex items-center gap-1 text-amber-500"
                          aria-label={`${rating} star rating`}
                        >
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={14}
                              strokeWidth={2.4}
                              className={
                                index < rating
                                  ? "fill-amber-400 text-amber-500"
                                  : "fill-none text-slate-300"
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {rating}/5
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="whitespace-nowrap text-sm font-semibold text-slate-600">
                          {formatDate(review.createdAt)}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-[4px] border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-[0.98]"
                          onClick={() => {
                            setMessage("");
                            setDeleting(review);
                          }}
                        >
                          <Trash2 size={15} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 bg-white">
          <AdminPagination
            pagination={list.pagination}
            onPage={list.setPage}
            onLimit={list.setLimit}
          />
        </div>
      </section>

      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete review?"
        description={`This permanently removes "${deleting?.review_title || "this review"
          }" from ${deleting?.user || "the customer"}.`}
        confirmLabel="Delete review"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}