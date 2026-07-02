"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers3,
} from "lucide-react";
import { CategoryNode } from "./types";

type Props = {
  level1: string;
  level2: string;
  level3: string;
  setLevel1: (v: string) => void;
  setLevel2: (v: string) => void;
  setLevel3: (v: string) => void;
  level1Options: CategoryNode[];
  level2Options: CategoryNode[];
  level3Options: CategoryNode[];
};

export default function StepCategory({
  level1,
  level2,
  level3,
  setLevel1,
  setLevel2,
  setLevel3,
  level1Options,
  level2Options,
  level3Options,
}: Props) {
  const [expandedRoot, setExpandedRoot] = useState<
    string | null | undefined
  >(undefined);
  const [expandedSub, setExpandedSub] = useState<string | null | undefined>(
    undefined,
  );

  const visibleRoot = expandedRoot === undefined ? level1 : expandedRoot;
  const visibleSub = expandedSub === undefined ? level2 : expandedSub;

  const nameById = (id: string) => {
    const stack = [...level1Options];

    while (stack.length) {
      const node = stack.pop()!;

      if (node._id === id) return node.name;
      if (node.children) stack.push(...node.children);
    }

    return "";
  };

  const pathItems = [level1, level2, level3]
    .map((id) => ({ id, name: nameById(id) }))
    .filter((item) => item.id && item.name);

  const pathLabel = pathItems.map((item) => item.name).join(" / ");

  return (
    <section className="step-category grid gap-5">
      <div className="rounded-[4px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-black/10 bg-white text-slate-950 shadow-sm">
              <FolderTree size={18} strokeWidth={2.4} />
            </span>

            <div className="min-w-0">
              <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">
                Product category
              </h2>

              <p className="mt-1 text-sm font-medium leading-5 text-[var(--muted)]">
                Select category, sub category and child category for this
                product.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-[4px] border border-black/10 px-3 py-1.5 text-xs font-bold text-slate-500">
            <Layers3 size={14} strokeWidth={2.4} />
            3 level category
          </div>
        </div>

        <div className="mt-4 rounded-[4px] border border-black/10 bg-white px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Selected path
          </p>

          {pathItems.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {pathItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="rounded-[4px] border border-black/10 bg-white px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
                    {item.name}
                  </span>

                  {index < pathItems.length - 1 ? (
                    <ChevronRight
                      size={14}
                      strokeWidth={2.6}
                      className="text-slate-400"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
              No category selected yet.
            </p>
          )}

          {pathLabel ? (
            <p className="mt-2 text-xs font-medium text-slate-400">
              {pathLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3">
        {level1Options.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-black/15 bg-white p-6 text-center">
            <p className="text-sm font-black text-slate-700">
              No categories available
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Create categories first, then assign them to this product.
            </p>
          </div>
        ) : null}

        {level1Options.map((root, rootIndex) => {
          const isRootOpen = visibleRoot === root._id;
          const isRootSelected = level1 === root._id;
          const rootChildren =
            visibleRoot === level1 ? level2Options : root.children || [];
          const hasSubCategories = rootChildren.length > 0;

          return (
            <div
              key={root._id}
              className={`category-card overflow-hidden rounded-[4px] border bg-white shadow-sm transition ${
                isRootSelected
                  ? "border-slate-950/30"
                  : "border-black/10 hover:border-black/20"
              }`}
            >
              <button
                type="button"
                aria-expanded={isRootOpen}
                className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                onClick={() => {
                  const next = isRootOpen ? null : root._id;

                  setExpandedRoot(next);
                  setExpandedSub(null);
                  setLevel1(root._id);
                  setLevel2("");
                  setLevel3("");
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-[4px] border text-xs font-black transition ${
                      isRootSelected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-black/10 bg-white text-slate-500 group-hover:border-slate-950 group-hover:text-slate-950"
                    }`}
                  >
                    {String(rootIndex + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-950">
                        {root.name}
                      </span>

                      {isRootSelected ? (
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-slate-950 text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>

                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      {hasSubCategories
                        ? `${rootChildren.length} sub categories`
                        : "No sub categories"}
                    </span>
                  </span>
                </span>

                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-black/10 bg-white text-slate-500 transition group-hover:border-slate-950 group-hover:text-slate-950 ${
                    isRootOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown size={16} strokeWidth={2.7} />
                </span>
              </button>

              {isRootOpen ? (
                <div className="border-t border-black/10 px-3 py-3">
                  {hasSubCategories ? (
                    <div className="grid gap-2">
                      {rootChildren.map((sub) => {
                        const isSubOpen = visibleSub === sub._id;
                        const isSubSelected = level2 === sub._id;
                        const subChildren =
                          visibleSub === level2
                            ? level3Options
                            : sub.children || [];
                        const hasChildCategories = subChildren.length > 0;

                        return (
                          <div
                            key={sub._id}
                            className={`overflow-hidden rounded-[4px] border bg-white transition ${
                              isSubSelected
                                ? "border-slate-950/25"
                                : "border-black/10 hover:border-black/20"
                            }`}
                          >
                            <button
                              type="button"
                              aria-expanded={isSubOpen}
                              className="group flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
                              onClick={() => {
                                const next = isSubOpen ? null : sub._id;

                                setExpandedSub(next);
                                setLevel2(sub._id);
                                setLevel3("");
                              }}
                            >
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="truncate text-sm font-black text-slate-900">
                                    {sub.name}
                                  </span>

                                  {isSubSelected ? (
                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-slate-950 text-white">
                                      <Check size={12} strokeWidth={3} />
                                    </span>
                                  ) : null}
                                </span>

                                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                                  {hasChildCategories
                                    ? `${subChildren.length} child categories`
                                    : "No child categories"}
                                </span>
                              </span>

                              <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-black/10 bg-white text-slate-500 transition group-hover:border-slate-950 group-hover:text-slate-950 ${
                                  isSubOpen ? "rotate-180" : ""
                                }`}
                              >
                                <ChevronDown size={15} strokeWidth={2.7} />
                              </span>
                            </button>

                            {isSubOpen ? (
                              <div className="grid gap-2 border-t border-black/10 px-3 py-3">
                                {hasChildCategories ? (
                                  subChildren.map((child) => {
                                    const isChildSelected =
                                      level3 === child._id;

                                    return (
                                      <button
                                        key={child._id}
                                        type="button"
                                        className={`group flex w-full items-center justify-between gap-3 rounded-[4px] border px-3 py-2.5 text-left text-sm font-bold transition active:scale-[0.99] ${
                                          isChildSelected
                                            ? "border-slate-950 bg-slate-950 text-white"
                                            : "border-black/10 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950"
                                        }`}
                                        onClick={() => setLevel3(child._id)}
                                      >
                                        <span className="truncate">
                                          {child.name}
                                        </span>

                                        {isChildSelected ? (
                                          <Check size={15} strokeWidth={3} />
                                        ) : (
                                          <ChevronRight
                                            size={15}
                                            strokeWidth={2.7}
                                            className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-950"
                                          />
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="rounded-[4px] border border-dashed border-black/10 px-3 py-3 text-xs font-semibold text-slate-400">
                                    No child categories inside this sub
                                    category.
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[4px] border border-dashed border-black/10 px-3 py-4 text-sm font-semibold text-slate-400">
                      No sub categories inside this category.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .step-category {
          animation: categoryStepIn 220ms ease-out;
        }

        .category-card {
          position: relative;
        }

        .category-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px transparent;
          transition: box-shadow 260ms ease;
        }

        .category-card:hover::before {
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
        }

        @keyframes categoryStepIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .step-category,
          .category-card,
          .category-card::before,
          .step-category * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}