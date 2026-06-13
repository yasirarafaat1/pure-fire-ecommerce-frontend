"use client";

import AdminResourceList from "../components/AdminResourceList";
import { formatInrFromPaise } from "../lib/money";

type Customer = {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
};

export default function CustomersPage() {
  return (
    <AdminResourceList<Customer>
      endpoint="/customers"
      title="Customers"
      description="Profiles and commerce history derived from registered customers and orders."
      emptyLabel="customers"
      columns={[
        { key: "name", label: "Customer", render: (item) => item.name || "Unnamed" },
        { key: "email", label: "Email", render: (item) => item.email },
        { key: "phone", label: "Phone", render: (item) => item.phone || "—" },
        { key: "orders", label: "Orders", render: (item) => item.orderCount },
        { key: "spent", label: "Total spent", render: (item) => formatInrFromPaise(item.totalSpent) },
        {
          key: "last",
          label: "Last order",
          render: (item) => item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleDateString() : "—",
        },
      ]}
    />
  );
}
