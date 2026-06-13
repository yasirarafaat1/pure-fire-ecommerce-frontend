import AdminShell from "./components/AdminShell";

export const metadata = {
  title: "Admin",
  description: "Admin panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>{children}</AdminShell>
  );
}
