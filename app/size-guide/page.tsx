"use client";

import { useEffect, useMemo, useState } from "react";

type SizeGuideSection = {
  _id?: string;
  heading: string;
  body?: string;
  table?: {
    headers?: string[];
    rows?: string[][];
  };
};

type SizeGuide = {
  title: string;
  intro?: string;
  sections: SizeGuideSection[];
  updatedAt?: string;
};

const fallbackGuide: SizeGuide = {
  title: "Size Guide",
  intro: "Use this guide to compare measurements before choosing a size.",
  sections: [
    {
      heading: "How to Measure",
      body: "Measure around the fullest part of your chest, waist, and hips. Keep the tape comfortably firm and parallel to the floor.",
    },
  ],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SizeGuidePage() {
  const [guide, setGuide] = useState<SizeGuide>(fallbackGuide);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/size-guide", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.data?.sections?.length) setGuide(payload.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(
    () =>
      guide.sections.map((section, index) => ({
        ...section,
        id: slugify(section.heading) || `section-${index + 1}`,
      })),
    [guide.sections],
  );

  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
          <div className="overflow-hidden rounded-xl border border-slate-900/10 bg-white shadow-sm">
            <div className="border-b border-slate-900/10 bg-slate-950 px-4 py-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                Size guide
              </p>
              <p className="mt-2 text-sm font-black leading-5">
                Jump to a measurement section
              </p>
            </div>

            <nav className="max-h-[62vh] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid gap-1.5">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group grid grid-cols-[34px_1fr] items-center gap-2 rounded-lg border border-transparent px-2 py-2.5 text-sm font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-[11px] text-slate-500 transition group-hover:bg-white/10 group-hover:text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 truncate">{section.heading}</span>
                  </a>
                ))}
              </div>
            </nav>

            <div className="border-t border-slate-900/10 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold leading-5 text-slate-500">
                Tables are a general reference. Check product fit notes before ordering.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-slate-900/10 pb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Pure Fire
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              {guide.title}
            </h1>
            {guide.intro ? (
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 md:text-base">
                {guide.intro}
              </p>
            ) : null}
            {loading ? (
              <div className="mt-5 h-3 w-40 animate-pulse rounded-sm bg-slate-200" />
            ) : null}
          </div>

          <div className="mt-8 grid gap-8">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-sm border border-slate-900/10 bg-white p-5 shadow-sm md:p-6"
              >
                <h2 className="text-xl font-black tracking-tight md:text-2xl">
                  {section.heading}
                </h2>
                {section.body ? (
                  <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                    {section.body}
                  </p>
                ) : null}

                {section.table?.headers?.length ? (
                  <div className="mt-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th
                              key={header}
                              className="border border-slate-200 bg-slate-950 px-3 py-2 font-black text-white"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(section.table.rows || []).map((row, rowIndex) => (
                          <tr key={`${section.id}-${rowIndex}`} className="odd:bg-slate-50">
                            {section.table?.headers?.map((header, cellIndex) => (
                              <td
                                key={`${header}-${cellIndex}`}
                                className="border border-slate-200 px-3 py-2 font-semibold text-slate-700"
                              >
                                {row[cellIndex] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
