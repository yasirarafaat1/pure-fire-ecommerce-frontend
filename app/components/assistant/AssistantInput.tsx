"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AssistantMessage } from "./types";

export default function AssistantInput({
  disabled,
  onSend,
  replyTo,
  onCancelReply,
}: {
  disabled: boolean;
  onSend: (value: string) => void;
  replyTo?: AssistantMessage["replyTo"];
  onCancelReply?: () => void;
}) {
  const [value, setValue] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="grid gap-2 border-t border-black/10 bg-white p-3">
      {replyTo ? (
        <div className="flex items-start justify-between gap-2 rounded-[6px] border border-black/10 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
              Replying to {replyTo.role === "user" ? "you" : "assistant"}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-slate-700">{replyTo.content}</div>
          </div>
          <button type="button" onClick={onCancelReply} className="shrink-0 text-xs font-black text-slate-500">
            Cancel
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          className="input min-h-11 flex-1 text-sm"
          placeholder="Ask about products or orders..."
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[5px] border border-black bg-black text-white disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}
