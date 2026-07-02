"use client";

import { useState } from "react";
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
  const [expandedRoot, setExpandedRoot] = useState<string | null | undefined>(undefined);
  const [expandedSub, setExpandedSub] = useState<string | null | undefined>(undefined);
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

  const pathLabel = [level1, level2, level3].map(nameById).filter(Boolean).join(" / ");

  return (
    <section className="grid gap-4">
      <div className="text-sm text-[var(--muted)]">
        Pick category - sub category - sub child. Selected:{" "}
        <span className="text-black font-semibold">{pathLabel || "none"}</span>
      </div>

      <div className="grid gap-3">
        {level1Options.map((root) => (
          <div key={root._id} className="border border-black/5 rounded-lg">
            <button
              className={`w-full text-left px-4 py-3 flex justify-between items-center ${visibleRoot === root._id ? "bg-black/5" : ""}`}
              onClick={() => {
                const next = visibleRoot === root._id ? null : root._id;
                setExpandedRoot(next);
                setExpandedSub(null);
                setLevel1(root._id);
                setLevel2("");
                setLevel3("");
              }}
            >
              <span>{root.name}</span>
              <span className="text-xs text-[var(--muted)]">{visibleRoot === root._id ? "^" : "v"}</span>
            </button>

            {visibleRoot === root._id && (
              <div className="px-4 pb-3">
                {(visibleRoot === level1 ? level2Options : root.children || []).map((sub) => (
                  <div key={sub._id} className="mt-2 border border-black/5 rounded">
                    <button
                      className={`w-full text-left px-3 py-2 flex justify-between items-center ${visibleSub === sub._id ? "bg-black/5" : ""}`}
                      onClick={() => {
                        const next = visibleSub === sub._id ? null : sub._id;
                        setExpandedSub(next);
                        setLevel2(sub._id);
                        setLevel3("");
                      }}
                    >
                      <span>{sub.name}</span>
                      <span className="text-xs text-[var(--muted)]">{visibleSub === sub._id ? "^" : "v"}</span>
                    </button>

                    {visibleSub === sub._id && (
                      <div className="px-3 pb-2">
                        {(visibleSub === level2 ? level3Options : sub.children || []).map((child) => (
                          <button
                            key={child._id}
                            className={`w-full text-left px-3 py-2 rounded mb-1 ${level3 === child._id ? "bg-black text-white" : "bg-black/5"}`}
                            onClick={() => setLevel3(child._id)}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
