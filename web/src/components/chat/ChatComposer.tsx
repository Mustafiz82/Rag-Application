"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IoSendOutline } from "react-icons/io5";

export function ChatComposer({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const canSend = useMemo(() => text.trim().length > 0 && !disabled, [text, disabled]);

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          rows={2}
          placeholder="Ask a question about your PDF…"
          className={[
            "w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm text-zinc-900 ring-1 ring-zinc-200",
            "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
            "dark:bg-zinc-950 dark:text-zinc-50 dark:ring-white/10 dark:placeholder:text-zinc-500 dark:focus:ring-white/10",
          ].join(" ")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!canSend) return;
              const next = text.trim();
              setText("");
              onSend(next);
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <span>Shift+Enter for new line</span>
          <span>Session-scoped</span>
        </div>
      </div>

      <Button
        disabled={!canSend}
        className="shrink-0"
        onClick={() => {
          if (!canSend) return;
          const next = text.trim();
          setText("");
          onSend(next);
        }}
      >
        <IoSendOutline className="h-4 w-4" />
        Send
      </Button>
    </div>
  );
}

