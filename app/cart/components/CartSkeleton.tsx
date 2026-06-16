export default function CartSkeleton() {
  return (
    <div className="grid gap-5 p-5">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-black/10" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-black/10" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="flex gap-4 border-b border-black/10 pb-4" key={index}>
          <div className="h-32 w-24 animate-pulse rounded bg-black/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-black/10" />
            <div className="h-8 w-28 animate-pulse rounded bg-black/10" />
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded bg-black/10" />
              <div className="h-9 w-24 animate-pulse rounded bg-black/10" />
            </div>
          </div>
        </div>
      ))}
      <div className="space-y-3 rounded-xl border border-black/10 p-4">
        <div className="h-4 w-full animate-pulse rounded bg-black/10" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-black/10" />
        <div className="h-10 w-full animate-pulse rounded bg-black/10" />
      </div>
    </div>
  );
}
