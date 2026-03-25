"use client";

export default function ProductPageLoader() {
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-2 md:gap-8 items-start">
        <div className="grid gap-3">
          <div className="md:hidden">
            <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory scrollbar-hide">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-w-full snap-center pr-4 border border-black/10 overflow-hidden"
                >
                  <div className="w-full h-[75vh] bg-black/5 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="mt-2 h-1 rounded bg-black/10 overflow-hidden">
              <div className="h-full w-1/3 bg-black/20 animate-pulse" />
            </div>
          </div>
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="border border-black/15 rounded-[5px] overflow-hidden bg-white"
              >
                <div className="aspect-[3/4] w-full bg-black/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <div className="h-6 w-3/4 rounded-[6px] bg-black/5 border border-black/10 animate-pulse" />
          <div className="h-5 w-1/2 rounded-[6px] bg-black/5 border border-black/10 animate-pulse" />
          <div className="h-4 w-1/3 rounded-[6px] bg-black/5 border border-black/10 animate-pulse" />
          <div className="grid gap-2">
            <div className="h-12 w-full rounded-[10px] bg-black/5 border border-black/10 animate-pulse" />
            <div className="h-12 w-full rounded-[10px] bg-black/5 border border-black/10 animate-pulse" />
          </div>
          <div className="h-24 w-full rounded-[8px] bg-black/5 border border-black/10 animate-pulse" />
          <div className="h-24 w-full rounded-[8px] bg-black/5 border border-black/10 animate-pulse" />
        </div>
      </div>
      {[
        { title: "Recently Viewed", count: 4 },
        { title: "Similar Products", count: 4 },
      ].map((rail) => (
        <section key={rail.title} className="grid pl-4 pr-4 md:p-4 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold border-b border-gray-600">{rail.title}</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: rail.count }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0"
                style={{ width: "calc((100vw - 48px)/3.2)", maxWidth: "200px" }}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[3px] bg-black/5 border border-black/10 animate-pulse" />
                <div className="p-2 pl-0 md:p-4 md:pl-0 grid gap-2">
                  <div className="h-4 w-full rounded-[5px] bg-black/5 border border-black/10 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-[5px] bg-black/5 border border-black/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="grid gap-3">
        <div className="h-5 w-40 rounded-[6px] bg-black/5 border border-black/10 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-black/10 rounded-[6px] p-4 bg-white animate-pulse">
              <div className="h-3 w-1/3 rounded-[5px] bg-black/5 border border-black/10" />
              <div className="mt-3 h-4 w-full rounded-[5px] bg-black/5 border border-black/10" />
              <div className="mt-2 h-4 w-4/5 rounded-[5px] bg-black/5 border border-black/10" />
              <div className="mt-4 h-3 w-1/2 rounded-[5px] bg-black/5 border border-black/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
