"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHeaderStrip } from "@/components/chat/ChatHeaderStrip";
import { ChatMessageList, type ChatMessage } from "@/components/chat/ChatMessageList";
import { ChatPreUpload } from "@/components/chat/ChatPreUpload";
import { OutsideKnowledgeConsent } from "@/components/chat/OutsideKnowledgeConsent";

type Mode = "preUpload" | "uploading" | "chat";

function ensureSessionId() {
  const existing = window.localStorage.getItem("sessionId");
  console.log("existing", existing)
  if (existing) return existing;
  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem("sessionId", id);
  return id;
}

function getOutsideKnowledgePref(sessionId: string) {
  return window.localStorage.getItem(`outside:${sessionId}`) === "1";
}

function setOutsideKnowledgePref(sessionId: string, allowed: boolean) {
  window.localStorage.setItem(`outside:${sessionId}`, allowed ? "1" : "0");
}

export function ChatScreen() {
  const [mode, setMode] = useState<Mode>("preUpload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false); // NEW: Track AI status
  const [needsOutsideConsent, setNeedsOutsideConsent] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);

  useEffect(() => {
    ensureSessionId();
    const onNew = () => {
      const sessionId = ensureSessionId();
      window.localStorage.removeItem(`outside:${sessionId}`);
      setMode("preUpload");
      setFileName(null);
      setMessages([]);
      setUploadError(null);
      setNeedsOutsideConsent(false);
      setPendingQuestion(null);
      setStreamStatus(null);
    };
    window.addEventListener("session:new", onNew as EventListener);
    return () => window.removeEventListener("session:new", onNew as EventListener);
  }, []);

  async function handleFilePick(file: File) {
    setUploadError(null);
    setMode("uploading");
    const sessionId = ensureSessionId();
    window.localStorage.removeItem(`outside:${sessionId}`);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://rag-application-3w9w.onrender.com/ingest", {
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
      setNeedsOutsideConsent(false);
      setPendingQuestion(null);
      setStreamStatus(null);
    } catch {
      setUploadError("Could not reach the server. Is the API running?");
      setMode("preUpload");
    }
  }

  // NEW: Handle RAG Streaming
  async function handleSendMessage(text: string, forceAllowOutside?: boolean) {

    // if (isStreaming) return;
    
    const sessionId = ensureSessionId();
    console.log("handleSendMessage", text, forceAllowOutside)
    const allowOutsideKnowledge = forceAllowOutside ?? getOutsideKnowledgePref(sessionId);
    // #region agent log
    fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H1',location:'web/ChatScreen.tsx:handleSendMessage_entry',message:'handleSendMessage called',data:{textPreview:text.slice(0,120),sessionIdPresent:!!sessionId,allowOutsideKnowledge,forceAllowOutside:typeof forceAllowOutside},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setNeedsOutsideConsent(false);
    setPendingQuestion(null);
    setStreamStatus("Starting request...");

    try {
      // #region agent log
      fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H2',location:'web/ChatScreen.tsx:before_fetch',message:'Starting /ask fetch (SSE)',data:{url:'https://rag-application-3w9w.onrender.com/ask?stream=1',sessionIdPresent:!!sessionId,allowOutsideKnowledge},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      const res = await fetch(`https://rag-application-3w9w.onrender.com/ask?p=${encodeURIComponent(text)}&stream=1`, {
        headers: {
          "x-session-id": sessionId,
          "x-allow-outside-knowledge": allowOutsideKnowledge ? "1" : "0",
          Accept: "text/event-stream",
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H2',location:'web/ChatScreen.tsx:after_fetch',message:'Received /ask response headers',data:{ok:res.ok,status:res.status,contentType:res.headers.get('content-type'),hasBody:!!res.body},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      type SsePayload = Record<string, unknown>;

      const handleEventBlock = (block: string) => {
        const lines = block.split("\n").filter(Boolean);
        const eventLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        const event = eventLine?.slice("event:".length).trim() ?? "message";
        const dataRaw = dataLine?.slice("data:".length).trim() ?? "{}";
        let data: SsePayload = {};
        try {
          data = JSON.parse(dataRaw) as SsePayload;
        } catch {
          data = { raw: dataRaw };
        }
        const previewToken = data["token"];
        const previewStep = data["step"];
        const previewMessage = data["message"];
        // #region agent log
        fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H3',location:'web/ChatScreen.tsx:handleEventBlock',message:'Parsed SSE block',data:{event,dataKeys:Object.keys(data).slice(0,8),dataPreview:String(previewToken ?? previewStep ?? previewMessage ?? '').slice(0,80)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log

        if (event === "token") {
          const token = String((data as { token?: unknown }).token ?? "");
          accumulated += token;
          setStreamStatus("Streaming answer...");
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, content: accumulated } : msg))
          );
          return;
        }

        if (event === "status") {
          // helpful console trace for debugging performance
          console.log("[ask:status]", data?.step ?? data?.message ?? data);
          const step = String((data as { step?: unknown }).step ?? "");
          const details = (data as { data?: { model?: string; attempt?: number; retryable?: boolean } }).data;
          if (step === "start") setStreamStatus("Request started...");
          else if (step === "retrieving") setStreamStatus("Retrieving relevant context...");
          else if (step === "model_start") {
            const model = details?.model ? ` ${details.model}` : "";
            const attempt = details?.attempt ? ` (attempt ${details.attempt})` : "";
            setStreamStatus(`Generating with${model}${attempt}...`);
          } else if (step === "model_error") {
            const model = details?.model ? ` ${details.model}` : "";
            const retryable = details?.retryable ? " retryable failure." : " failure.";
            setStreamStatus(`Model${model}${retryable} Switching...`);
          } else if (step === "fallback_non_streaming") {
            setStreamStatus("Fallback mode: generating final response...");
          }
          return;
        }

        if (event === "final") {
          if ((data as { needConsent?: unknown }).needConsent) {
            setNeedsOutsideConsent(true);
            setPendingQuestion(text);
            setStreamStatus(null);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content:
                        String((data as { answer?: unknown }).answer ?? "") ||
                        "This isn’t in your PDF. Allow outside knowledge?",
                    }
                  : msg
              )
            );
            return;
          }

          const answer = String((data as { answer?: unknown }).answer ?? accumulated);
          accumulated = answer;
          setStreamStatus(null);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, content: answer } : msg))
          );
          return;
        }

        if (event === "error") {
          console.error("[ask:error]", data);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: "Error: Could not get a response." } : msg
            )
          );
          setStreamStatus("Error while generating response.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // #region agent log
        fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H3',location:'web/ChatScreen.tsx:reader_chunk',message:'Received SSE bytes',data:{bufferLen:buffer.length,accumulatedLen:accumulated.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (block.trim()) handleEventBlock(block);
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H4',location:'web/ChatScreen.tsx:stream_end',message:'SSE stream ended',data:{accumulatedLen:accumulated.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
    } catch (err) {
      console.error("Chat error:", err);
      const errMessage = err instanceof Error ? err.message : String(err ?? "");
      // #region agent log
      fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H5',location:'web/ChatScreen.tsx:catch',message:'Chat error caught',data:{errMessage:errMessage.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantId ? { ...msg, content: "Error: Could not get a response." } : msg
        )
      );
      setStreamStatus("Error: could not connect to API.");
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
            <ChatMessageList messages={activeMessages} streamStatus={streamStatus} />
          </div>
          {needsOutsideConsent && pendingQuestion && (
            <OutsideKnowledgeConsent
              isBusy={isStreaming}
              onAllow={() => {
                const sessionId = ensureSessionId();
                setOutsideKnowledgePref(sessionId, true);
                void handleSendMessage(pendingQuestion, true);
              }}
              onDecline={() => {
                const sessionId = ensureSessionId();
                setOutsideKnowledgePref(sessionId, false);
                setNeedsOutsideConsent(false);
                setPendingQuestion(null);
              }}
            />
          )}
          <div className="mt-4 border-t border-zinc-200/70 pt-4 dark:border-white/10">
            <ChatComposer onSend={handleSendMessage} disabled={isStreaming} />
          </div>
        </div>
      </div>
    </div>
  );
}