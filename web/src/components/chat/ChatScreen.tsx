"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHeaderStrip } from "@/components/chat/ChatHeaderStrip";
import { ChatMessageList, type ChatMessage } from "@/components/chat/ChatMessageList";
import { ChatPreUpload } from "@/components/chat/ChatPreUpload";

type Mode = "preUpload" | "chat";

function ensureSessionId() {
  const existing = window.localStorage.getItem("sessionId");
  if (existing) return existing;
  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem("sessionId", id);
  return id;
}

export function ChatScreen() {
  const [mode, setMode] = useState<Mode>("preUpload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    ensureSessionId();
    const onNew = () => {
      setMode("preUpload");
      setFileName(null);
      setMessages([]);
    };
    window.addEventListener("session:new", onNew as EventListener);
    return () => window.removeEventListener("session:new", onNew as EventListener);
  }, []);

  const hasPdf = mode === "chat" && !!fileName;
  const placeholderMessages = useMemo<ChatMessage[]>(() => {
    if (!hasPdf) return [];
    return messages.length > 0
      ? messages
      : [
          {
            id: "assistant-welcome",
            role: "assistant",
            content:
              "PDF loaded (UI only). Ask a question and I’ll respond with a placeholder answer.",
          },
        ];
  }, [hasPdf, messages]);

  if (mode === "preUpload") {
    return (
      <div className="py-10 sm:py-14">
        <ChatPreUpload
          onPick={(file) => {
            setFileName(file.name);
            setMode("chat");
            setMessages([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8 sm:py-10">
      <div className="space-y-4">
        <ChatHeaderStrip
          fileName={fileName ?? "Untitled.pdf"}
          onChangePdf={() => {
            setMode("preUpload");
            setFileName(null);
            setMessages([]);
          }}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="h-[52vh] overflow-y-auto pr-1">
            <ChatMessageList messages={placeholderMessages} />
          </div>

          <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-white/10">
            <ChatComposer
              onSend={(text) => {
                const user: ChatMessage = {
                  id: `u-${Date.now()}`,
                  role: "user",
                  content: text,
                };
                const assistant: ChatMessage = {
                  id: `a-${Date.now() + 1}`,
                  role: "assistant",
                  content: "Placeholder answer (UI only).",
                };
                setMessages((prev) => [...prev, user, assistant]);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

