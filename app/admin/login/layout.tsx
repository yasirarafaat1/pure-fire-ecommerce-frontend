export const metadata = {
  title: "Admin Login | PureFire",
  description: "Admin login",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
