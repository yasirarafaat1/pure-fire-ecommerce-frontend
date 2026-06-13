"use client";

import AdminResourceList from "../components/AdminResourceList";
import AdminStatusBadge from "../components/AdminStatusBadge";

type Shipment = {
  _id: string;
  order_id?: number;
  FullName?: string;
  courier_name?: string;
  tracking_number?: string;
  status?: string;
  shippedAt?: string;
};

export default function ShippingPage() {
  return (
    <AdminResourceList<Shipment>
      endpoint="/shipping"
      title="Shipping"
      description="Shipment status and existing Shiprocket or manually recorded courier details."
      emptyLabel="shipments"
      columns={[
        { key: "order", label: "Order", render: (item) => `#${item.order_id || item._id}` },
        { key: "customer", label: "Customer", render: (item) => item.FullName || "Unknown" },
        { key: "courier", label: "Courier", render: (item) => item.courier_name || "Not assigned" },
        { key: "tracking", label: "Tracking", render: (item) => item.tracking_number || "—" },
        { key: "status", label: "Status", render: (item) => <AdminStatusBadge status={item.status} /> },
        {
          key: "date",
          label: "Shipped",
          render: (item) => item.shippedAt ? new Date(item.shippedAt).toLocaleString() : "—",
        },
      ]}
    />
  );
}
