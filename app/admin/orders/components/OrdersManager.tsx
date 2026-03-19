"use client";

import { useEffect, useMemo, useState } from "react";
import { LuRefreshCcw } from "react-icons/lu";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import OrdersList from "./OrdersList";
import OrderDrawer from "./OrderDrawer";
import { Order, formatStatus, getOrderAmount, getOrderTitle } from "./ordersUtils";

const API_BASE = "/api/admin";
const PAGE_SIZE = 25;

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/get-orders`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error("Failed to fetch orders");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err: any) {
      setMessage("Could not load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  const openDrawer = (order: Order) => {
    setSelected(order);
    setDrawerVisible(true);
    window.requestAnimationFrame(() => setDrawerOpen(true));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.setTimeout(() => setDrawerVisible(false), 220);
  };

  const handleStatusChange = (value: string) => {
    const key = selected?.order_id ?? selected?._id ?? "";
    if (!key) return;
    setDraftStatus((prev) => ({ ...prev, [String(key)]: value }));
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const key = selected.order_id ?? selected._id ?? "";
    if (!key) return;
    const nextStatus = draftStatus[String(key)] || (selected.status || "pending");
    if (nextStatus === (selected.status || "pending")) return;
    setUpdatingId(key);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/update-order-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selected.order_id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setOrders((prev) =>
        prev.map((o) =>
          (o.order_id || o._id) === key ? { ...o, status: nextStatus } : o,
        ),
      );
      setSelected((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      setDraftStatus((prev) => {
        const next = { ...prev };
        delete next[String(key)];
        return next;
      });
    } catch (err: any) {
      setMessage(err.message || "Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => (o.status || "").includes("pending")).length;
    const delivered = orders.filter((o) => (o.status || "").includes("deliver")).length;
    return { total, pending, delivered };
  }, [orders]);

  const selectedKey = selected?.order_id ?? selected?._id ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const parts = [
        o.order_id,
        o._id,
        o.FullName,
        o.phone1,
        o.status,
        getOrderTitle(o),
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return parts.includes(q);
    });
  }, [orders, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const getTime = (o: Order) => {
      const raw =
        (o as any).createdAt ||
        (o as any).created_at ||
        (o as any).order_date ||
        (o as any).date;
      const t = raw ? new Date(raw).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    const getAmount = (o: Order) => Number(getOrderAmount(o) || 0);
    list.sort((a, b) => {
      if (sort === "date-asc") return getTime(a) - getTime(b);
      if (sort === "date-desc") return getTime(b) - getTime(a);
      if (sort === "amount-asc") return getAmount(a) - getAmount(b);
      if (sort === "amount-desc") return getAmount(b) - getAmount(a);
      return 0;
    });
    return list;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-xs text-[var(--muted)]">
            Total {summary.total} | Pending {summary.pending} | Delivered {summary.delivered}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <input
            className="input"
            placeholder="Search orders"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Amount high to low</option>
            <option value="amount-asc">Amount low to high</option>
          </select>
          <button
            type="button"
            onClick={fetchOrders}
            className="btn btn-ghost px-3 py-2 flex items-center gap-2"
          >
            <LuRefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="border border-black/15 rounded-[5px] p-6 text-sm text-[var(--muted)]">
          Loading orders...
        </div>
      )}

      {!loading && message && (
        <div className="border border-black/15 rounded-[5px] p-6 text-sm text-[var(--muted)]">
          {message}
        </div>
      )}

      {!loading && !message && sorted.length === 0 && (
        <div className="border border-black/15 rounded-[5px] p-6 text-sm text-[var(--muted)]">
          No orders found.
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <>
          <OrdersList orders={pageItems} selectedId={selectedKey} onSelect={openDrawer} />
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
            <span className="text-[var(--muted)]">
              Showing {start + 1}-{Math.min(start + PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost !px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <span className="text-xs">Page {safePage} of {totalPages}</span>
              <button
                className="btn btn-ghost !px-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      <OrderDrawer
        order={selected}
        open={drawerOpen}
        visible={drawerVisible}
        draftStatus={selectedKey ? draftStatus[String(selectedKey)] : ""}
        updating={updatingId === selectedKey}
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
        onUpdate={handleUpdate}
      />

      {selected?.status && (
        <div className="text-xs text-[var(--muted)]">
          Current status: {formatStatus(selected.status)}
        </div>
      )}
    </div>
  );
}
