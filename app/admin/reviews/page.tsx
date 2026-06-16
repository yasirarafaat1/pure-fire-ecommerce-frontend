"use client";

import { useState } from "react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Review = {
  _id: string; product_id: number; product?: { name?: string }; rating: number; user?: string;
  review_title?: string; comment?: string; status?: string; createdAt?: string;
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
      setMessage("Review deleted.");
      list.setItems((current) => current.filter((review) => review._id !== deletedId));
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Reviews" description="Find and delete customer product reviews when cleanup is required." />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search customer or review" value={String(list.filters.q || "")} onChange={(event) => list.updateFilters({ q: event.target.value })} />
      
        </div>
        {message && <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm">{message}</p>}
        {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No reviews found" description="Change search or moderation status." /> : (
          <div className="divide-y divide-slate-100">{list.items.map((review) => (
            <article className="grid gap-3 p-5 lg:grid-cols-[180px_1fr_auto]" key={review._id}>
              <div><p className="font-medium">{review.product?.name || `Product #${review.product_id}`}</p><p className="text-sm text-amber-600">{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</p><p className="text-xs text-slate-500">{review.user || "Anonymous"}</p></div>
              <div><p className="font-medium">{review.review_title || "Review"}</p><p className="mt-1 text-sm text-slate-600">{review.comment || "No comment"}</p><div className="mt-2"><AdminStatusBadge status={review.status} /></div></div>
              <div className="flex flex-wrap items-start gap-2">
                <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => { setMessage(""); setDeleting(review); }}>Delete</button>
              </div>
            </article>
          ))}</div>
        )}
        <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
      </section>
      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete review?"
        description={`This permanently removes "${deleting?.review_title || "this review"}" from ${deleting?.user || "the customer"}.`}
        confirmLabel="Delete review"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
