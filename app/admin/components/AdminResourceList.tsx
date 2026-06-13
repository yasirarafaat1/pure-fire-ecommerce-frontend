"use client";

import { RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useAdminList } from "../hooks/useAdminList";
import AdminPageHeader from "./AdminPageHeader";
import AdminPagination from "./AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminStates";

export type ResourceColumn<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  endpoint: string;
  title: string;
  description: string;
  columns: ResourceColumn<T>[];
  emptyLabel: string;
  action?: ReactNode;
  filters?: ReactNode;
};

export default function AdminResourceList<T extends { _id?: string; id?: string }>({
  endpoint,
  title,
  description,
  columns,
  emptyLabel,
  action,
  filters,
}: Props<T>) {
  const list = useAdminList<T>(endpoint);
  return (
    <div className="grid gap-6">
      <AdminPageHeader title={title} description={description} action={action} />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
          <label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              aria-label={`Search ${title}`}
              className="w-full bg-transparent text-sm outline-none"
              placeholder={`Search ${title.toLowerCase()}`}
              value={String(list.filters.q || "")}
              onChange={(event) => list.updateFilters({ q: event.target.value })}
            />
          </label>
          {filters}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            onClick={list.refresh}
          >
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title={`No ${emptyLabel}`} description="Try changing the search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => <th className="px-4 py-3" key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.items.map((item, index) => (
                  <tr className="border-t border-slate-100" key={item._id || item.id || index}>
                    {columns.map((column) => (
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700" key={column.key}>
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          pagination={list.pagination}
          onPage={list.setPage}
          onLimit={list.setLimit}
        />
      </section>
    </div>
  );
}
