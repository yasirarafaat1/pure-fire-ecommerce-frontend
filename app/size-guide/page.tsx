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

type SectionWithId = SizeGuideSection & {
  id: string;
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

const HEADER_OFFSET = 160;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatUpdatedAt(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hasValidTable(section: SizeGuideSection) {
  return Boolean(section.table?.headers?.length);
}

export default function SizeGuidePage() {
  const [guide, setGuide] = useState<SizeGuide>(fallbackGuide);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/user/size-guide", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.data?.sections?.length) {
          setGuide(payload.data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const sections = useMemo<SectionWithId[]>(
    () =>
      guide.sections.map((section, index) => {
        const baseId = slugify(section.heading) || "section";

        return {
          ...section,
          id: `${baseId}-${index + 1}`,
        };
      }),
    [guide.sections],
  );

  useEffect(() => {
    if (!sections.length) return;

    const updateActiveSection = () => {
      let currentId = sections[0]?.id || "";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;

        const top = element.getBoundingClientRect().top + window.scrollY;

        if (window.scrollY + HEADER_OFFSET + 20 >= top) {
          currentId = section.id;
        }
      }

      setActiveId(currentId);
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, top - HEADER_OFFSET),
      behavior: "smooth",
    });

    setActiveId(id);
  };

  const updatedAt = formatUpdatedAt(guide.updatedAt);

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <section className="border-b border-slate-900/10 bg-[#fbfaf8] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">

              <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                {guide.title}
              </h1>

              {guide.intro ? (
                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 md:text-base">
                  {guide.intro}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-[4px] border border-slate-900/10 px-4 py-3">
              <p className="text-sm font-500 tracking-[0.16em] text-slate-400">
                Updated At
              </p>
              <p className="text-sm font-700 text-slate-950">
                {loading ? "Loading..." : updatedAt || "Latest"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-2">
              <div className="h-3 w-56 animate-pulse rounded-[4px] bg-slate-200" />
              <div className="h-3 w-40 animate-pulse rounded-[4px] bg-slate-200" />
            </div>
          ) : null}
        </div>
      </section>

      <div className="sticky top-[92px] z-30 border-b border-slate-900/10 bg-[#fbfaf8]/95 px-4 py-3 backdrop-blur lg:hidden">
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section, index) => {
            const active = activeId === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-current={active ? "true" : undefined}
                className={`shrink-0 rounded-[4px] border px-4 py-2 text-xs font-black transition ${active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-900/10 bg-white text-slate-800 hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                  }`}
              >
                {String(index + 1).padStart(2, "0")} · {section.heading}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start lg:px-4">
        <aside className="size-guide-sidebar hidden lg:block lg:self-start">
          <div className="size-guide-sidebar-card overflow-hidden rounded-[4px] border border-slate-900/10 bg-white shadow-sm">
            <nav
              data-lenis-prevent
              className="size-guide-sidebar-nav overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="grid gap-1.5">
                {sections.map((section, index) => {
                  const active = activeId === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      aria-current={active ? "true" : undefined}
                      className={`group grid w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-[4px] border px-2 py-2.5 text-left text-sm font-black transition ${active
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-transparent bg-white text-slate-800 hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                        }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-[4px] text-[11px] font-black transition ${active
                          ? "bg-white text-slate-950"
                          : "bg-slate-100 text-slate-700 group-hover:bg-white group-hover:text-slate-950"
                          }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={`min-w-0 truncate ${active
                          ? "text-white"
                          : "text-slate-900 group-hover:text-white"
                          }`}
                      >
                        {section.heading}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-900/10 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold leading-5 text-slate-600">
                Use measurements as reference. Fit may vary by fabric, cut and
                product style.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="grid gap-6">
            {sections.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-[170px] overflow-hidden rounded-[4px] border border-slate-900/10 bg-white shadow-sm transition hover:border-slate-900/20 hover:shadow-md"
              >
                <div className="border-b border-slate-900/10 bg-white px-5 py-5 md:px-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-slate-950 text-xs font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950 md:text-2xl">
                        {section.heading}
                      </h2>

                      {section.body ? (
                        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                          {section.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {hasValidTable(section) ? (
                  <div className="p-4 md:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Measurement table
                      </p>

                      <p className="text-xs font-semibold text-slate-500 md:hidden">
                        Swipe to view
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[4px] border border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <table className="min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                          <tr>
                            {section.table?.headers?.map(
                              (header, headerIndex) => (
                                <th
                                  key={`${section.id}-${header}-${headerIndex}`}
                                  className={`border-b border-slate-200 bg-slate-950 px-4 py-3 font-black text-white ${headerIndex === 0
                                    ? "sticky left-0 z-10 min-w-[150px]"
                                    : ""
                                    }`}
                                >
                                  {header}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {(section.table?.rows || []).map((row, rowIndex) => (
                            <tr
                              key={`${section.id}-${rowIndex}`}
                              className="odd:bg-slate-50/80 hover:bg-amber-50/60"
                            >
                              {section.table?.headers?.map(
                                (header, cellIndex) => (
                                  <td
                                    key={`${section.id}-${rowIndex}-${header}-${cellIndex}`}
                                    className={`border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 ${cellIndex === 0
                                      ? "sticky left-0 z-[5] bg-inherit font-black text-slate-950"
                                      : ""
                                      }`}
                                  >
                                    {row[cellIndex] || "-"}
                                  </td>
                                ),
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
  @media (min-width: 1024px) {
    .size-guide-sidebar {
      position: sticky;
      top: calc(var(--nav-shell-top, 0px) + 92px);
      align-self: start;
      height: calc(100dvh - var(--nav-shell-top, 0px) - 112px);
    }

    .size-guide-sidebar-card {
      display: flex;
      max-height: 100%;
      flex-direction: column;
    }

    .size-guide-sidebar-nav {
      max-height: calc(100dvh - var(--nav-shell-top, 0px) - 282px);
      overscroll-behavior: contain;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .size-guide-sidebar-nav::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  }
`}</style>
    </main>
  );
}
