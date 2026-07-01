"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function AssistantInput({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (value: string) => void;
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
    <form onSubmit={submit} className="flex gap-2 border-t border-black/10 bg-white p-3">
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
    </form>
  );
}
