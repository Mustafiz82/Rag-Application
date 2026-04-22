// api/query.ts
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { callGeminiWithFallback, type ChatModelName } from "./llm.js";

export type RagCitation = { id: string; score: number; textPreview: string };
export type RagMode = "qa" | "explain_topic" | "mcq" | "question_patterns";

export type RagResponse =
  | {
      ok: true;
      mode: RagMode;
      answer: string;
      citations: RagCitation[];
      usedOutsideKnowledge: boolean;
      modelUsed?: ChatModelName;
    }
  | {
      ok: false;
      mode: RagMode;
      needConsent: true;
      answer: string;
      citations: RagCitation[];
    };

function detectMode(message: string): RagMode {
  const m = message.toLowerCase();
  if (/\bmcq\b|\bmultiple choice\b|\bquiz\b|\btest me\b/.test(m)) return "mcq";
  if (/\bquestion pattern\b|\bquestion patterns\b|\bpatterns\b|\bimportant questions\b/.test(m)) return "question_patterns";
  if (/\bexplain\b|\bcomplete topic\b|\bnotes\b|\bsummary\b/.test(m)) return "explain_topic";
  return "qa";
}

function pickModels(): ChatModelName[] {
  return [
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.1-flash-lite-preview",
  ];
}

function normalizeText(t: unknown): string {
  return typeof t === "string" ? t : "";
}

function isLikelyUselessChunk(text: string): boolean {
  const s = text.trim();
  if (!s) return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(s)) return true;
  return s.length < 40;
}

async function retrieveContext(sessionId: string, query: string, topK: number) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index(process.env.PINECONE_INDEX!);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_QUERY,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const queryEmbedding = await embeddings.embedQuery(query);

  const queryResponse = await index.namespace(sessionId).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  const matches = (queryResponse.matches ?? []).map((m) => {
    const text = normalizeText((m as any)?.metadata?.text);
    return { id: String(m.id ?? ""), score: Number(m.score ?? 0), text };
  });

  const good = matches.filter((m) => !isLikelyUselessChunk(m.text));
  const context = good.map((m) => m.text).join("\n\n");
  const citations: RagCitation[] = good.slice(0, 5).map((m) => ({
    id: m.id,
    score: m.score,
    textPreview: m.text.slice(0, 160),
  }));

  return { context, citations, topScore: good[0]?.score ?? 0 };
}

function buildGroundedPrompt(mode: RagMode, context: string, message: string) {
  const base = [
    "You are an enterprise-grade PDF assistant.",
    "RULES:",
    "- Use ONLY the provided PDF context.",
    "- If the context is insufficient, say so and ask 1-2 clarifying questions.",
    "- Do not invent facts.",
    "",
    "PDF CONTEXT:",
    context || "(empty)",
    "",
  ].join("\n");

  if (mode === "mcq") {
    return [
      base,
      "TASK: Create 1 multiple-choice question (MCQ) based only on the PDF context.",
      "Return exactly:",
      "Question:",
      "A) ...",
      "B) ...",
      "C) ...",
      "D) ...",
      "Correct: <letter>",
      "Explanation: <1-3 sentences, grounded in context>",
      "",
      `USER REQUEST: ${message}`,
    ].join("\n");
  }

  if (mode === "question_patterns") {
    return [
      base,
      "TASK: Extract common exam/question patterns suggested by this PDF context.",
      "Return 8-12 bullet points. Each bullet should be a template like 'Define X' or 'Explain factors affecting X'.",
      "Only include patterns you can justify from the context.",
      "",
      `USER REQUEST: ${message}`,
    ].join("\n");
  }

  if (mode === "explain_topic") {
    return [
      base,
      "TASK: Explain the topic requested by the user using only the PDF context.",
      "Use a structured format: Overview, Key points, Example(s) if present in PDF, Quick recap.",
      "If examples are not present in the PDF context, explicitly say so.",
      "",
      `USER REQUEST: ${message}`,
    ].join("\n");
  }

  return [
    base,
    "TASK: Answer the user's question using only the PDF context.",
    "",
    `QUESTION: ${message}`,
    "ANSWER:",
  ].join("\n");
}

function buildOutsidePrompt(message: string) {
  return [
    "You are a helpful assistant.",
    "The user asked a question that may not be in their PDF.",
    "Answer using general knowledge. If you are unsure, say so.",
    "",
    `QUESTION: ${message}`,
    "ANSWER:",
  ].join("\n");
}

export async function answerWithRagPolicy(opts: {
  sessionId: string;
  message: string;
  allowOutsideKnowledge: boolean;
}): Promise<RagResponse> {
  const { sessionId, message, allowOutsideKnowledge } = opts;
  const mode = detectMode(message);
console.log("mode", mode);
  const { context, citations, topScore } = await retrieveContext(sessionId, message, mode === "qa" ? 8 : 12);

  const insufficient = context.trim().length < 250 || topScore < 0.12;
  if (insufficient && !allowOutsideKnowledge) {
    console.log("insufficient", insufficient)
    return {
      ok: false,
      mode,
      needConsent: true,
      citations,
      answer:
        "I couldn't find enough information in your PDF context to answer confidently. " +
        "Do you want me to answer using outside knowledge (not from your PDF)?",
    };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

  if (insufficient && allowOutsideKnowledge) {
    console.log("insufficient and allowOutsideKnowledge", insufficient, allowOutsideKnowledge)
    const outsidePrompt = buildOutsidePrompt(message);
    const out = await callGeminiWithFallback(outsidePrompt, { apiKey, models: pickModels(), maxAttemptsPerModel: 1 });
    return {
      ok: true,
      mode,
      citations,
      usedOutsideKnowledge: true,
      modelUsed: out.model,
      answer: "Outside PDF answer (because the PDF context was insufficient):\n\n" + String(out.content ?? ""),
    };
  }

  const groundedPrompt = buildGroundedPrompt(mode, context, message);
  const out = await callGeminiWithFallback(groundedPrompt, { apiKey, models: pickModels(), maxAttemptsPerModel: 1 });

  return {
    ok: true,
    mode,
    citations,
    usedOutsideKnowledge: false,
    modelUsed: out.model,
    answer: String(out.content ?? ""),
  };
}

type RagStreamEvent =
  | { type: "status"; step: string; data?: Record<string, unknown> }
  | { type: "token"; token: string }
  | { type: "final"; data: RagResponse }
  | { type: "error"; message: string };

function isRetryableError(err: unknown): boolean {
  const anyErr = err as any;
  const status =
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.response?.status ??
    anyErr?.cause?.status ??
    anyErr?.cause?.statusCode;
  if (typeof status === "number") return status === 429 || (status >= 500 && status <= 599);
  const msg = String(anyErr?.message ?? "");
  return /timeout/i.test(msg) || /ETIMEDOUT/i.test(msg) || /ECONNRESET/i.test(msg) || /EAI_AGAIN/i.test(msg) || /429/.test(msg);
}

function isRateLimitError(err: unknown): boolean {
  const anyErr = err as any;
  const status =
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.response?.status ??
    anyErr?.cause?.status ??
    anyErr?.cause?.statusCode;
  if (status === 429) return true;
  const msg = String(anyErr?.message ?? "");
  return /429/.test(msg) || /too many requests/i.test(msg);
}

function backoffMs(attemptIndex: number) {
  const base = 250 * Math.pow(2, attemptIndex);
  const jitter = Math.floor(Math.random() * 120);
  return Math.min(2000, base + jitter);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout waiting for ${label} after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

export async function* streamAnswerWithRagPolicy(opts: {
  sessionId: string;
  message: string;
  allowOutsideKnowledge: boolean;
}): AsyncGenerator<RagStreamEvent> {
  const { sessionId, message, allowOutsideKnowledge } = opts;
  const mode = detectMode(message);
  const log = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
    fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  };

  yield { type: "status", step: "retrieving", data: { mode } };
  log("H1", "api/query.ts:retrieving_start", "Retrieval started", { mode, sessionIdPresent: !!sessionId });
  const { context, citations, topScore } = await retrieveContext(sessionId, message, mode === "qa" ? 8 : 12);
  log("H1", "api/query.ts:retrieving_done", "Retrieval done", { topScore, contextLen: context.length, citations: citations.length });

  const insufficient = context.trim().length < 250 || topScore < 0.12;
  if (insufficient && !allowOutsideKnowledge) {
    const data: RagResponse = {
      ok: false,
      mode,
      needConsent: true,
      citations,
      answer:
        "I couldn't find enough information in your PDF context to answer confidently. " +
        "Do you want me to answer using outside knowledge (not from your PDF)?",
    };
    yield { type: "final", data };
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "Missing GOOGLE_API_KEY" };
    return;
  }

  const prompt = insufficient && allowOutsideKnowledge
    ? buildOutsidePrompt(message)
    : buildGroundedPrompt(mode, context, message);

  const models = pickModels();
  let lastErr: unknown = null;
  let tokenCount = 0;
  let sawAnyToken = false;
  const perAttemptTimeoutMs = 12000;

  for (const modelName of models) {
    const model = new ChatGoogleGenerativeAI({ model: modelName, apiKey });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        yield { type: "status", step: "model_start", data: { model: modelName, attempt: attempt + 1 } };
        log("H2", "api/query.ts:model_start", "Model stream start", { model: modelName, attempt: attempt + 1, insufficient, allowOutsideKnowledge });
        let answerText = "";

        const stream = await withTimeout(
          model.stream(prompt),
          perAttemptTimeoutMs,
          `${modelName} stream`
        );
        for await (const chunk of stream) {
          const token = typeof chunk?.content === "string" ? chunk.content : String(chunk?.content ?? "");
          if (!token) continue;
          answerText += token;
          tokenCount += 1;
          if (!sawAnyToken) {
            sawAnyToken = true;
            log("H3", "api/query.ts:first_token", "First token received", { model: modelName, attempt: attempt + 1, tokenPreview: token.slice(0, 60) });
          }
          yield { type: "token", token };
        }

        const data: RagResponse = {
          ok: true,
          mode,
          citations,
          usedOutsideKnowledge: Boolean(insufficient && allowOutsideKnowledge),
          modelUsed: modelName,
          answer:
            insufficient && allowOutsideKnowledge
              ? "Outside PDF answer (because the PDF context was insufficient):\n\n" + answerText
              : answerText,
        };

        yield { type: "final", data };
        log("H4", "api/query.ts:final_sent", "Final sent", { ok: true, model: modelName, answerLen: String(data.answer ?? "").length, tokenCount });
        return;
      } catch (err) {
        lastErr = err;
        // #region agent log
        fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H2',location:'api/query.ts:model_error',message:'Model stream failed',data:{model:modelName,attempt:attempt+1,retryable:isRetryableError(err),errMessage:String((err as any)?.message ?? err ?? '').slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        if (/Timeout waiting for/i.test(String((err as any)?.message ?? ""))) {
          log("H2", "api/query.ts:model_timeout", "Model attempt timed out; switching model", {
            model: modelName,
            attempt: attempt + 1,
            timeoutMs: perAttemptTimeoutMs,
          });
        }
        yield {
          type: "status",
          step: "model_error",
          data: { model: modelName, attempt: attempt + 1, retryable: isRetryableError(err) },
        };
        if (isRateLimitError(err)) {
          log("H2", "api/query.ts:rate_limit_skip_retry", "Rate limited; switching model without retry", {
            model: modelName,
            attempt: attempt + 1,
          });
          break;
        }
        if (!isRetryableError(err)) break;
        await sleep(backoffMs(attempt));
      }
    }
  }

  // fallback to non-streaming (last resort) so user gets something
  try {
    yield { type: "status", step: "fallback_non_streaming" };
    log("H5", "api/query.ts:fallback_non_streaming", "Attempting non-streaming fallback", { tokenCount, sawAnyToken });
    const out = await callGeminiWithFallback(prompt, { apiKey, models, maxAttemptsPerModel: 2 });
    const data: RagResponse = {
      ok: true,
      mode,
      citations,
      usedOutsideKnowledge: Boolean(insufficient && allowOutsideKnowledge),
      modelUsed: out.model,
      answer: String(out.content ?? ""),
    };
    yield { type: "final", data };
    log("H4", "api/query.ts:final_sent_fallback", "Final sent (fallback)", { ok: true, model: out.model, answerLen: data.answer.length });
  } catch (e) {
    log("H5", "api/query.ts:fallback_failed", "Non-streaming fallback failed", { errMessage: String((e as any)?.message ?? e ?? '').slice(0,200) });
    yield { type: "error", message: String((e as any)?.message ?? lastErr ?? "Unknown error") };
  }
}