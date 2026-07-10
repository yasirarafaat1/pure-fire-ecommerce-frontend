"use client";

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-black/[0.045] before:absolute before:inset-0 before:-translate-x-full before:animate-[loaderShimmer_1.45s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent ${className}`}
    />
  );
}

export default function ProductPageLoader() {
  return (
    <div className="grid gap-5 md:gap-8">
      <style jsx>{`
        @keyframes loaderShimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .loader-scroll-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .loader-scroll-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div className="grid items-start gap-4 md:grid-cols-[1.2fr_1fr] md:gap-8">
        {/* Gallery skeleton */}
        <div className="grid gap-3 md:sticky md:top-4">
          {/* Mobile gallery */}
          <div className="md:hidden">
            <div className="loader-scroll-hide flex snap-x snap-mandatory gap-3 overflow-x-auto">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-w-full snap-center overflow-hidden border border-black/10 bg-white"
                >
                  <SkeletonBox className="h-[72svh] min-h-[520px] w-full" />
                </div>
              ))}
            </div>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10">
              <SkeletonBox className="h-full w-1/3 rounded-full" />
            </div>
          </div>

          {/* Desktop gallery */}
          <div className="hidden grid-cols-2 gap-3 md:grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-[5px] border border-black/15 bg-white"
              >
                <SkeletonBox className="aspect-[3/4] w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sticky info panel skeleton */}
        <aside className="md:sticky md:top-4">
          <div className="grid gap-4 border-black/10 bg-white px-3 pb-2 md:rounded-[6px] md:border md:p-5">
            {/* Breadcrumb desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <SkeletonBox className="h-3 w-16 rounded-full border border-black/10" />
              <SkeletonBox className="h-3 w-3 rounded-full border border-black/10" />
              <SkeletonBox className="h-3 w-24 rounded-full border border-black/10" />
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <SkeletonBox className="h-6 w-[88%] rounded-[6px] border border-black/10" />
              <SkeletonBox className="h-5 w-[62%] rounded-[6px] border border-black/10" />
            </div>

            {/* Rating / meta */}
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-7 w-20 rounded-full border border-black/10" />
              <SkeletonBox className="h-4 w-28 rounded-[5px] border border-black/10" />
            </div>

            {/* Price */}
            <div className="flex items-end gap-2">
              <SkeletonBox className="h-8 w-28 rounded-[6px] border border-black/10" />
              <SkeletonBox className="h-5 w-16 rounded-[6px] border border-black/10" />
              <SkeletonBox className="h-5 w-20 rounded-full border border-black/10" />
            </div>

            {/* Promo timer */}
            <div className="rounded-[4px] border border-red-100 bg-red-50/60 px-3 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <SkeletonBox className="h-8 w-24 rounded-[4px] border border-red-100" />
                  <SkeletonBox className="h-8 w-9 rounded-[4px] border border-red-100" />
                </div>
                <SkeletonBox className="h-9 w-28 shrink-0 rounded-[4px] border border-red-100" />
              </div>
            </div>

            {/* Available offers */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBox className="h-4 w-32 rounded-[5px] border border-black/10" />
                <SkeletonBox className="h-3 w-12 rounded-[5px] border border-black/10" />
              </div>

              <div className="rounded-[8px] border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBox className="h-4 w-24 rounded-[5px] border border-emerald-100" />
                  <SkeletonBox className="h-7 w-20 rounded-[5px] border border-emerald-100" />
                </div>
                <SkeletonBox className="mt-3 h-3 w-3/4 rounded-[5px] border border-emerald-100" />
                <SkeletonBox className="mt-2 h-3 w-24 rounded-[5px] border border-emerald-100" />
              </div>
            </div>

            {/* Color selector */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-20 rounded-[5px] border border-black/10" />
                <SkeletonBox className="h-4 w-24 rounded-[5px] border border-black/10" />
              </div>

              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonBox
                    key={idx}
                    className="h-12 w-12 rounded-full border border-black/10"
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-16 rounded-[5px] border border-black/10" />
                <SkeletonBox className="h-4 w-20 rounded-[5px] border border-black/10" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <SkeletonBox
                    key={idx}
                    className="h-11 rounded-[10px] border border-black/10"
                  />
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBox className="h-12 rounded-[10px] border border-black/10" />
              <SkeletonBox className="h-12 rounded-[10px] border border-black/10" />
            </div>

            {/* Delivery */}
            <SkeletonBox className="h-20 w-full rounded-[8px] border border-black/10" />

            {/* Highlights */}
            <div className="grid gap-2 rounded-[8px] border border-black/10 p-3">
              <SkeletonBox className="h-4 w-28 rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-full rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-[88%] rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-[72%] rounded-[5px] border border-black/10" />
            </div>

            {/* Description */}
            <div className="grid gap-2 rounded-[8px] border border-black/10 p-3">
              <SkeletonBox className="h-4 w-24 rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-full rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-[92%] rounded-[5px] border border-black/10" />
              <SkeletonBox className="h-3 w-[78%] rounded-[5px] border border-black/10" />
            </div>
          </div>
        </aside>
      </div>

      {/* Recently Viewed / Similar Products skeleton */}
      {[
        { title: "Recently Viewed", count: 4 },
        { title: "Similar Products", count: 4 },
      ].map((rail) => (
        <section key={rail.title} className="grid gap-4 px-4 md:px-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold leading-none text-black">
              {rail.title}
            </h3>

            <SkeletonBox className="h-4 w-16 rounded-full border border-black/10" />
          </div>

          <div className="loader-scroll-hide flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: rail.count }).map((_, idx) => (
              <div
                key={idx}
                className="min-w-[calc((100vw-48px)/3.2)] max-w-[200px] flex-shrink-0 md:min-w-[180px]"
              >
                <SkeletonBox className="aspect-[3/4] overflow-hidden rounded-[3px] border border-black/10" />

                <div className="grid gap-2 py-2 md:py-3">
                  <SkeletonBox className="h-4 w-full rounded-[5px] border border-black/10" />
                  <SkeletonBox className="h-3 w-1/2 rounded-[5px] border border-black/10" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Reviews skeleton */}
      <section className="grid gap-3 px-4 md:px-0">
        <SkeletonBox className="h-5 w-32 rounded-[6px] border border-black/10" />

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-[6px] border border-black/10 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-8 w-8 rounded-full border border-black/10" />
                <div className="grid flex-1 gap-1">
                  <SkeletonBox className="h-3 w-1/3 rounded-[5px] border border-black/10" />
                  <SkeletonBox className="h-3 w-20 rounded-[5px] border border-black/10" />
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <SkeletonBox className="h-4 w-full rounded-[5px] border border-black/10" />
                <SkeletonBox className="h-4 w-4/5 rounded-[5px] border border-black/10" />
                <SkeletonBox className="h-3 w-1/2 rounded-[5px] border border-black/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
