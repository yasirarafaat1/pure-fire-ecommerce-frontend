import AdminNavbar from "./components/admin-navbar";

export const metadata = {
  title: "Admin | PureFire",
  description: "Admin panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminNavbar />
      <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
