import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../types/admin";

type Props = {
  pagination: Pagination;
  onPage: (page: number) => void;
  onLimit?: (limit: number) => void;
};

export default function AdminPagination({ pagination, onPage, onLimit }: Props) {
  const start = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = Math.min(pagination.total, pagination.page * pagination.limit);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-500">
        Showing {start}-{end} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        {onLimit && (
          <select
            aria-label="Rows per page"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            value={pagination.limit}
            onChange={(event) => onLimit(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((limit) => (
              <option value={limit} key={limit}>
                {limit} rows
              </option>
            ))}
          </select>
        )}
        <button
          aria-label="Previous page"
          className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-24 text-center">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)}
        </span>
        <button
          aria-label="Next page"
          className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
