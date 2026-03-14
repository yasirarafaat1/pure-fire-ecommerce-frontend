"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const apply = (cmd: string, val = "") => document.execCommand(cmd, false, val);

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // keep DOM in sync when editing an existing product
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => onChange(ref.current?.innerHTML || "");

  const toolbarButton = (label: string, action: () => void) => (
    <button className="btn btn-ghost !px-3 !py-2" type="button" onClick={action}>
      {label}
    </button>
  );

  return (
    <div className="border border-black/10 rounded-lg bg-white/80">
      <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-black/10 text-sm">
        {toolbarButton("B", () => apply("bold"))}
        {toolbarButton("I", () => apply("italic"))}
        {toolbarButton("U", () => apply("underline"))}
        {toolbarButton("H1", () => apply("formatBlock", "H1"))}
        {toolbarButton("H2", () => apply("formatBlock", "H2"))}
        {toolbarButton("P", () => apply("formatBlock", "P"))}
        {toolbarButton("Bullets", () => apply("insertUnorderedList"))}
        {toolbarButton("Numbers", () => apply("insertOrderedList"))}
        {toolbarButton("Text Red", () => apply("foreColor", "#e50914"))}
        {toolbarButton("Text Black", () => apply("foreColor", "#0f1115"))}
        {toolbarButton("Highlight", () => apply("backColor", "#fff59d"))}
        {toolbarButton("Clear", () => {
          apply("removeFormat");
          apply("insertParagraph");
        })}
      </div>
      <div
        ref={ref}
        className="input min-h-32 !rounded-t-none"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}
