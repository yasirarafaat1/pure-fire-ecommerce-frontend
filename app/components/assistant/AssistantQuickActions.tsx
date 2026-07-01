"use client";

const actions = [
  "Find products",
  "Track order",
  "My orders",
  "Wishlist",
  "Return policy",
  "Support",
];

export default function AssistantQuickActions({
  onSend,
}: {
  onSend: (value: string) => void;
}) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-black/10 bg-white px-3 py-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onSend(action)}
          className="shrink-0 rounded-[5px] border border-black/15 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-black hover:text-white"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
