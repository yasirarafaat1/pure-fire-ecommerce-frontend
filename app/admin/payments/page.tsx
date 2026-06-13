"use client";

import AdminResourceList from "../components/AdminResourceList";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { formatInrFromPaise } from "../lib/money";

type Payment = {
  _id: string;
  order_id?: number;
  user_email?: string;
  amount?: number;
  payment_method?: string;
  payment_status?: string;
  refund_status?: string;
  refund_amount?: number;
};

export default function PaymentsPage() {
  return (
    <AdminResourceList<Payment>
      endpoint="/payments"
      title="Payments and refunds"
      description="Payment records from existing order and provider transaction fields."
      emptyLabel="payments"
      columns={[
        { key: "order", label: "Order", render: (item) => `#${item.order_id || item._id}` },
        { key: "customer", label: "Customer", render: (item) => item.user_email || "-" },
        { key: "amount", label: "Amount", render: (item) => formatInrFromPaise(item.amount) },
        { key: "method", label: "Method", render: (item) => item.payment_method || "-" },
        {
          key: "status",
          label: "Payment",
          render: (item) => <AdminStatusBadge status={item.payment_status} />,
        },
        {
          key: "refund",
          label: "Refund",
          render: (item) =>
            item.refund_status ? `${item.refund_status} · ${formatInrFromPaise(item.refund_amount)}` : "-",
        },
      ]}
    />
  );
}
