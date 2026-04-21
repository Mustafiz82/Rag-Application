"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHeaderStrip } from "@/components/chat/ChatHeaderStrip";
import { ChatMessageList, type ChatMessage } from "@/components/chat/ChatMessageList";
import { ChatPreUpload } from "@/components/chat/ChatPreUpload";

type Mode = "preUpload" | "uploading" | "chat";

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
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    ensureSessionId();
    const onNew = () => {
      setMode("preUpload");
      setFileName(null);
      setMessages([]);
      setUploadError(null);
    };
    window.addEventListener("session:new", onNew as EventListener);
    return () => window.removeEventListener("session:new", onNew as EventListener);
  }, []);

  async function handleFilePick(file: File) {
    setUploadError(null);
    setMode("uploading");

    const sessionId = ensureSessionId();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/ingest", {
        method: "POST",
        headers: { "x-session-id": sessionId },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        setMode("preUpload");
        return;
      }

      setFileName(data.fileName);
      setMessages([]);
      setMode("chat");
    } catch {
      setUploadError("Could not reach the server. Is the API running?");
      setMode("preUpload");
    }
  }

  const placeholderMessages = useMemo<ChatMessage[]>(() => {
    if (mode !== "chat") return [];
    return messages.length > 0
      ? messages
      : [{ id: "welcome", role: "assistant", content: "PDF uploaded! Ask me anything about it." }];
  }, [mode, messages]);

  if (mode === "preUpload" || mode === "uploading") {
    return (
      <div className="py-10 sm:py-14">
        {uploadError && (
          <p className="mb-4 text-center text-sm text-red-500">{uploadError}</p>
        )}
        <ChatPreUpload
          onPick={handleFilePick}
          uploading={mode === "uploading"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8 sm:py-10">
      <div className="space-y-4">
        <ChatHeaderStrip
          fileName={fileName ?? "Untitled.pdf"}
          onChangePdf={() => { setMode("preUpload"); setFileName(null); setMessages([]); }}
        />
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="h-[52vh] overflow-y-auto pr-1">
            <ChatMessageList messages={placeholderMessages} />
          </div>
          <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-white/10">
            <ChatComposer
              onSend={(text) => {
                const user: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
                const assistant: ChatMessage = { id: `a-${Date.now() + 1}`, role: "assistant", content: "Placeholder answer." };
                setMessages((prev) => [...prev, user, assistant]);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
