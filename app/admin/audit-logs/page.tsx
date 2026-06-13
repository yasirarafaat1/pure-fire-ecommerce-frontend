"use client";

import AdminResourceList from "../components/AdminResourceList";

type Audit = {
  _id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
};

export default function AuditLogsPage() {
  return (
    <AdminResourceList<Audit>
      endpoint="/audit-logs"
      title="Activity logs"
      description="Read-only history of sensitive administrator actions."
      emptyLabel="audit events"
      columns={[
        { key: "date", label: "Date", render: (item) => new Date(item.createdAt).toLocaleString() },
        { key: "admin", label: "Admin", render: (item) => item.adminEmail || "System" },
        { key: "action", label: "Action", render: (item) => item.action.replaceAll("_", " ") },
        { key: "entity", label: "Entity", render: (item) => item.entityType },
        { key: "id", label: "Entity ID", render: (item) => item.entityId || "—" },
        { key: "ip", label: "IP", render: (item) => item.ip || "—" },
      ]}
    />
  );
}
