"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DeliveryAddressBox from "./components/DeliveryAddressBox";
import DeliveryProgress from "./components/DeliveryProgress";
import ItemsGrid from "./components/ItemsGrid";
import OrderHeader from "./components/OrderHeader";
import OrderSummaryBox from "./components/OrderSummaryBox";
import PaymentMeta from "./components/PaymentMeta";
import SimilarProductsRail from "./components/SimilarProductsRail";
import UpdatesDrawer from "./components/UpdatesDrawer";
import CancelOrderPanel from "./components/CancelOrderPanel";
import ReturnOrderPanel from "./components/ReturnOrderPanel";
import useOrderDetail from "./components/useOrderDetail";
import { formatMoney, formatOrderId, formatStatus } from "./components/orderUtils";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || "";
  const [copiedKey, setCopiedKey] = useState<"order" | "txn" | null>(null);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updatesVisible, setUpdatesVisible] = useState(false);
  const { authReady, order, setOrder, loading, error } = useOrderDetail(orderId);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  const openUpdates = () => {
    setUpdatesVisible(true);
    window.requestAnimationFrame(() => setUpdatesOpen(true));
  };

  const closeUpdates = () => {
    setUpdatesOpen(false);
    window.setTimeout(() => setUpdatesVisible(false), 220);
  };

  if (!authReady) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-6">
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="border border-black/15 rounded-[5px] p-6 grid gap-4 animate-pulse">
          <div className="h-4 w-40 bg-black/10 rounded" />
          <div className="h-3 w-60 bg-black/10 rounded" />
          <div className="h-24 bg-black/10 rounded" />
          <div className="h-24 bg-black/10 rounded" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="border border-black/15 rounded-[5px] p-6 text-sm text-[var(--muted)]">
          {error}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="border border-black/15 rounded-[5px] p-6 text-center grid gap-3">
          <div className="text-lg font-semibold">Order not found</div>
          <div className="text-sm text-[var(--muted)]">
            We could not locate this order. Please check the order id.
          </div>
          <div>
            <a href="/orders" className="btn btn-ghost px-4 py-2">
              Back to orders
            </a>
          </div>
        </div>
      </main>
    );
  }

  const orderKey = order.order_id ?? order._id ?? "";
  const orderDisplayId = formatOrderId(order.order_id ?? order._id);
  const txnId = order.razorpay_payment_id || order.razorpay_order_id || "";
  const items = order.items || [];
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;
  const totalPrice = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0,
  );
  const created = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "";
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const etaDays = Number(order.courier_etd || 0);
  const etaDate = etaDays
    ? new Date(createdDate.getTime() + etaDays * 24 * 60 * 60 * 1000)
    : null;
  const etaLabel = etaDate
    ? `${etaDate.getDate()}-${etaDate.getMonth() + 1}-${etaDate.getFullYear()}`
    : "";
  const steps = ["Placed", "Confirmed", "Shipped", "Out for delivery", "Delivered"];
  const statusKey = (order.status || "").toLowerCase();
  const cancelled = statusKey.includes("cancel");
  const returnRequested = statusKey.includes("return");
  let currentStep = 0;
  if (statusKey.includes("confirm")) currentStep = 1;
  if (statusKey.includes("ship")) currentStep = 2;
  if (statusKey.includes("out")) currentStep = 3;
  if (statusKey.includes("deliver")) currentStep = 4;
  if (cancelled) currentStep = 0;
  const progressPct =
    steps.length > 1 ? Math.round((currentStep / (steps.length - 1)) * 100) : 0;
  const stepGap = 72;
  const lineHeight = Math.max(0, (steps.length - 1) * stepGap);
  const progressHeight =
    steps.length > 1 ? Math.round((currentStep / (steps.length - 1)) * lineHeight) : 0;
  const seedProductId = items[0]?.product_id;
  const canCancel =
    !cancelled &&
    !returnRequested &&
    !statusKey.includes("ship") &&
    !statusKey.includes("out") &&
    !statusKey.includes("deliver");
  const canReturn = statusKey.includes("deliver") && !returnRequested;

  const copyText = async (value: string, key: "order" | "txn") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
    } catch {
      // ignore copy errors
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid gap-5">
        <OrderHeader
          orderId={orderDisplayId}
          created={created}
          copiedKey={copiedKey}
          onCopy={copyText}
        />

        <DeliveryProgress
          steps={steps}
          currentStep={currentStep}
          progressPct={progressPct}
          cancelled={cancelled}
          courierName={order.courier_name || ""}
          etaDays={etaDays || undefined}
          etaDate={etaLabel || undefined}
          statusNote={returnRequested ? "Return requested" : ""}
          onOpenUpdates={openUpdates}
        />

        <UpdatesDrawer
          open={updatesOpen}
          visible={updatesVisible}
          steps={steps}
          currentStep={currentStep}
          lineHeight={lineHeight}
          progressHeight={progressHeight}
          cancelled={cancelled}
          onClose={closeUpdates}
        />

        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="grid gap-4">
            <ItemsGrid items={items} formatMoney={formatMoney} />
            <SimilarProductsRail seedId={seedProductId} className="sm:hidden" />
            <PaymentMeta
              txnId={txnId}
              paymentStatus={formatStatus(order.payment_status)}
              paymentMethod={order.payment_method || "Razorpay"}
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            <CancelOrderPanel
              orderId={String(orderKey)}
              disabled={!canCancel}
              onCancelled={(nextOrder) =>
                setOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...nextOrder,
                        status: nextOrder?.status || "cancelled",
                        payment_status:
                          nextOrder?.payment_status || prev.payment_status || "cancelled",
                      }
                    : prev,
                )
              }
            />
            <ReturnOrderPanel
              orderId={String(orderKey)}
              disabled={!canReturn}
              onReturned={(nextOrder) =>
                setOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...nextOrder,
                        status: nextOrder?.status || "return_requested",
                      }
                    : prev,
                )
              }
            />
          </div>

          <div className="grid gap-4">
            <OrderSummaryBox
              totalQty={totalQty}
              totalPrice={totalPrice}
              orderAmount={Number(order.amount || 0)}
              formatMoney={formatMoney}
            />
            <DeliveryAddressBox
              name={order.FullName}
              phone1={order.phone1}
              phone2={order.phone2}
              addressLine1={order.address_line1}
              city={order.city}
              state={order.state}
              country={order.country}
              pinCode={order.pinCode}
              addressType={order.addressType}
            />
          </div>
        </div>

        <SimilarProductsRail seedId={seedProductId} className="hidden sm:block" />
      </div>
    </main>
  );
}
