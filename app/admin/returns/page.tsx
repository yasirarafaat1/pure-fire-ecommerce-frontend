"use client";

import AdminResourceList from "../components/AdminResourceList";
import AdminStatusBadge from "../components/AdminStatusBadge";

type ReturnOrder = {
  _id: string;
  order_id?: number;
  FullName?: string;
  user_email?: string;
  status?: string;
  cancellation_reason?: string;
  return_reason?: string;
  updatedAt?: string;
};

export default function ReturnsPage() {
  return (
    <AdminResourceList<ReturnOrder>
      endpoint="/returns"
      title="Returns and cancellations"
      description="Cancellation, return, replacement, and refund lifecycle records."
      emptyLabel="return or cancellation requests"
      columns={[
        { key: "order", label: "Order", render: (item) => `#${item.order_id || item._id}` },
        { key: "customer", label: "Customer", render: (item) => item.FullName || item.user_email || "Unknown" },
        { key: "status", label: "Status", render: (item) => <AdminStatusBadge status={item.status} /> },
        {
          key: "reason",
          label: "Reason",
          render: (item) => item.return_reason || item.cancellation_reason || "—",
        },
        {
          key: "updated",
          label: "Updated",
          render: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—",
        },
      ]}
    />
  );
}
