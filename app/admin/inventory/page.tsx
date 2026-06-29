/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../components/AdminStates";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type InventoryItem = {
  _id: string;
  product_id: number;
  product_image?: string[] | string | { url?: string; src?: string; image?: string }[];
  name: string;
  sku?: string;
  quantity: number;
  lowStockThreshold?: number;
  status?: string;
  catagory_id?: { name?: string };
};

function getImageSrc(image: InventoryItem["product_image"]) {
  let raw = "";

  if (Array.isArray(image)) {
    const first = image[0];

    if (typeof first === "string") {
      raw = first;
    } else if (first && typeof first === "object") {
      raw = first.url || first.src || first.image || "";
    }
  } else if (typeof image === "string") {
    raw = image;
  }

  raw = raw.trim();

  if (!raw) return "";

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return `/${raw}`;
}

function getStockStatus(quantity: number, threshold?: number) {
  const limit = threshold || 5;

  if (quantity <= 0) {
    return {
      label: "Out",
      title: "Out of stock",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (quantity <= limit) {
    return {
      label: "Low",
      title: "Low stock",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Active",
    title: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export default function InventoryPage() {
  const list = useAdminList<InventoryItem>("/products/inventory");
  const [message, setMessage] = useState("");

  const update = async (item: InventoryItem, quantity: number) => {
    setMessage("");

    try {
      await adminApi.patch(`/products/${item.product_id}/inventory`, {
        quantity,
        lowStockThreshold: item.lowStockThreshold || 5,
      });

      setMessage(`${item.name} stock updated.`);
      await list.refresh();
    } catch (error) {
      setMessage(
        error instanceof AdminApiError ? error.message : "Stock update failed",
      );
    }
  };

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Inventory"
        description="Monitor and safely update current product stock levels."
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
          <input
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            placeholder="Search product or SKU"
            value={String(list.filters.q || "")}
            onChange={(event) => list.updateFilters({ q: event.target.value })}
          />

          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 sm:w-40"
            value={String(list.filters.stock || "")}
            onChange={(event) =>
              list.updateFilters({ stock: event.target.value })
            }
          >
            <option value="">All stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {message && (
          <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            {message}
          </p>
        )}

        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState
            title="No inventory items"
            description="Change your search or stock filter."
          />
        ) : (
          <div className="w-full">
            <table className="w-full table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
              </colgroup>

              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-2 py-2.5 font-semibold">SKU</th>
                  <th className="px-2 py-2.5 font-semibold">Category</th>
                  <th className="px-2 py-2.5 font-semibold">Stock</th>
                  <th className="px-2 py-2.5 font-semibold">Limit</th>
                  <th className="px-2 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Update
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {list.items.map((item) => (
                  <InventoryRow
                    item={item}
                    update={update}
                    key={item._id}
                  />
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

function InventoryRow({
  item,
  update,
}: {
  item: InventoryItem;
  update: (item: InventoryItem, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity || 0));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setQuantity(String(item.quantity || 0));
  }, [item.quantity]);

  useEffect(() => {
    setImageFailed(false);
  }, [item.product_image]);

  const imageSrc = getImageSrc(item.product_image);
  const status = getStockStatus(item.quantity, item.lowStockThreshold);

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-3 py-2 align-middle">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {imageSrc && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-full w-full object-cover object-top"
                src={imageSrc}
                alt={item.name || "Product"}
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="text-[10px] font-bold uppercase text-slate-400">
                IMG
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="max-w-full truncate text-[13px] font-semibold leading-5 text-slate-950"
              title={item.name || "Untitled product"}
            >
              {item.name || "Untitled product"}
            </p>

            <p className="truncate text-[11px] leading-4 text-slate-500">
              #{item.product_id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-2 py-2 align-middle">
        <span
          className="block truncate font-mono text-[11px] text-slate-600"
          title={item.sku || "—"}
        >
          {item.sku || "—"}
        </span>
      </td>

      <td className="px-2 py-2 align-middle">
        <span
          className="block truncate text-[12px] text-slate-600"
          title={item.catagory_id?.name || "—"}
        >
          {item.catagory_id?.name || "—"}
        </span>
      </td>

      <td className="px-2 py-2 align-middle">
        <input
          aria-label={`Stock for ${item.name}`}
          className="h-8 w-full rounded-lg border border-slate-300 px-2 text-center text-xs font-semibold outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          min="0"
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </td>

      <td className="px-2 py-2 align-middle">
        <span className="block text-center text-xs font-semibold text-slate-700">
          {item.lowStockThreshold || 5}
        </span>
      </td>

      <td className="px-2 py-2 align-middle">
        <span
          title={status.title}
          className={`inline-flex h-7 w-full items-center justify-center whitespace-nowrap rounded-full border px-2 text-[10px] font-bold uppercase leading-none ${status.className}`}
        >
          {status.label}
        </span>
      </td>

      <td className="px-3 py-2 align-middle">
        <button
          type="button"
          className="ml-auto flex h-8 w-full max-w-[72px] items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          onClick={() => update(item, Math.max(0, Number(quantity) || 0))}
        >
          Save
        </button>
      </td>
    </tr>
  );
}