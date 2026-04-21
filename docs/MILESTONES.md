# Milestones

This file tracks delivery in a milestone + UAC style (aligned with AI-first delivery workflows).

---

## Milestone 1 - Session-Scoped PDF Ingestion

### Goal

Enable users to upload a PDF and index it into Pinecone under their session namespace.

### UAC

- [x] Upload endpoint accepts PDF via `multipart/form-data`.
- [x] `x-session-id` is required.
- [x] PDF is parsed into text.
- [x] Text is chunked and embedded.
- [x] Vectors are stored in Pinecone namespace = session ID.
- [x] API returns upload confirmation with `chunkCount`.

### Implementation notes

- Route: `POST /ingest`
- Code: `api/index.ts`, `api/embed.ts`

### Evidence

- Typical response:

```json
{ "success": true, "fileName": "Surface tension Updated.pdf", "chunkCount": 26 }
```

### Status

✅ Completed

---

## Milestone 2 - RAG Query + Streaming

### Goal

Support session-scoped question answering with SSE token streaming.

### UAC

- [x] Query endpoint accepts `p` and `x-session-id`.
- [x] Streaming mode is available via `stream=1` or `Accept: text/event-stream`.
- [x] API emits `status`, `token`, `final`, and `error` SSE events.
- [x] Frontend consumes SSE and renders token-by-token.
- [x] Frontend shows progress status labels.

### Implementation notes

- Route: `GET /ask`
- Code: `api/index.ts`, `api/query.ts`, `web/src/components/chat/ChatScreen.tsx`

### Evidence

- SSE event progression:
  - `status:start`
  - `status:retrieving`
  - `status:model_start`
  - `token...`
  - `final`

### Status

✅ Completed

---

## Milestone 3 - Reliability + Fallback + Consent

### Goal

Reduce user-visible failures under model throttling and prevent ungrounded responses.

### UAC

- [x] Model fallback ladder is implemented.
- [x] Retryable errors are handled.
- [x] Timeout-based model switching is implemented for stream startup.
- [x] Insufficient context triggers consent flow (`needConsent`) unless outside mode is allowed.
- [x] Outside-knowledge permission is remembered per session in frontend.

### Implementation notes

- Core files: `api/query.ts`, `api/llm.ts`, `web/src/components/chat/OutsideKnowledgeConsent.tsx`

### Status

✅ Completed

---

## Milestone 4 - UX + Formatting Improvements

### Goal

Improve answer readability and transparency during generation.

### UAC

- [x] UI displays loading/stream state.
- [x] Assistant messages render Markdown.
- [x] Inline code and code blocks are visually formatted.

### Implementation notes

- Files: `web/src/components/chat/ChatScreen.tsx`, `web/src/components/chat/ChatMessageList.tsx`

### Status

✅ Completed

---

## Milestone 5 - Test Automation (Planned)

### Goal

Introduce automated tests and coverage reporting.

### UAC

- [ ] API unit tests for query mode routing and context gate.
- [ ] Integration tests for `/ingest` and `/ask` (JSON + SSE).
- [ ] Coverage report generated in CI.

### Status

🟡 Planned

