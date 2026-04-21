import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type ChatModelName =
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-3-flash-preview"
  | "gemini-3.1-flash-lite-preview"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite";

export type LlmCallOptions = {
  apiKey: string;
  models: ChatModelName[];
  maxAttemptsPerModel?: number; // retries per model
};

function isRetryableError(err: unknown): boolean {
  const anyErr = err as any;
  const status =
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.response?.status ??
    anyErr?.cause?.status ??
    anyErr?.cause?.statusCode;

  if (typeof status === "number") {
    return status === 429 || (status >= 500 && status <= 599);
  }

  const msg = String(anyErr?.message ?? "");
  return (
    /timeout/i.test(msg) ||
    /ETIMEDOUT/i.test(msg) ||
    /ECONNRESET/i.test(msg) ||
    /EAI_AGAIN/i.test(msg) ||
    /429/.test(msg)
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attemptIndex: number) {
  const base = 250 * Math.pow(2, attemptIndex);
  const jitter = Math.floor(Math.random() * 120);
  return Math.min(2000, base + jitter);
}

export async function callGeminiWithFallback(
  prompt: string,
  { apiKey, models, maxAttemptsPerModel = 3 }: LlmCallOptions
) {
  let lastErr: unknown = null;

  for (const modelName of models) {
    const model = new ChatGoogleGenerativeAI({ model: modelName, apiKey });

    for (let attempt = 0; attempt < maxAttemptsPerModel; attempt++) {
      try {
        const result = await model.invoke(prompt);
        return { content: result.content, model: modelName as ChatModelName };
      } catch (err) {
        lastErr = err;
        if (!isRetryableError(err)) break;
        await sleep(backoffMs(attempt));
      }
    }
  }

  throw lastErr;
}

