"use client";

export default function OrdersSection() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((id) => (
        <div key={id} className="border border-black/15 rounded-[5px] p-4 grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Order #{202400 + id}</span>
            <span className="text-[var(--muted)]">Delivered</span>
          </div>
          <div className="text-sm">Women Cotton Trouser × 1</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">₹899</span>
            <button className="btn btn-ghost px-3 py-1 text-xs">View</button>
          </div>
        </div>
      ))}
    </div>
  );
}
