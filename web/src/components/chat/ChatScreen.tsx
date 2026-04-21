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
  const [isStreaming, setIsStreaming] = useState(false); // NEW: Track AI status

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

  // NEW: Handle RAG Streaming
  async function handleSendMessage(text: string) {
    if (isStreaming) return;
    
    const sessionId = ensureSessionId();
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      // Calling the streaming endpoint we built in the previous step
      const res = await fetch(`http://localhost:5000/ask?p=${encodeURIComponent(text)}`, {
        headers: { "x-session-id": sessionId },
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;

        // Update the last message (the assistant's message) with the new text
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantId ? { ...msg, content: accumulatedResponse } : msg
          )
        );
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantId ? { ...msg, content: "Error: Could not get a response." } : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const activeMessages = useMemo<ChatMessage[]>(() => {
    if (mode !== "chat") return [];
    return messages.length > 0
      ? messages
      : [{ id: "welcome", role: "assistant", content: "PDF uploaded! Ask me anything about it." }];
  }, [mode, messages]);

  if (mode === "preUpload" || mode === "uploading") {
    return (
      <div className="py-10 sm:py-14">
        {uploadError && <p className="mb-4 text-center text-sm text-red-500">{uploadError}</p>}
        <ChatPreUpload onPick={handleFilePick} uploading={mode === "uploading"} />
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
            <ChatMessageList messages={activeMessages} />
          </div>
          <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-white/10">
            <ChatComposer onSend={handleSendMessage} disabled={isStreaming} />
          </div>
        </div>
      </div>
    </div>
  );
}