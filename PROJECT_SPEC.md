# Project spec (source of truth)

Last updated: 2026-04-21

This file is the **single reference** for what we’re building and how the repo is structured.

---

## What we’re building

A **production-grade, session-based RAG (Retrieval-Augmented Generation) app**:

- Users upload a PDF and chat with it
- No authentication required
- Session isolation via request header (`x-session-id`)
- Privacy-first: data scoped per session (and should be purged / expired)
- Streaming responses over SSE
- Enterprise reliability (model fallback, retry strategy, consent-based outside knowledge)

---

## Current status (repo)

- Monorepo via npm workspaces:
  - `api/`: Express + TypeScript (ES Modules)
  - `web/`: Next.js + Tailwind + TypeScript
- The API already implements a working baseline:
  - `POST /ingest` (PDF → text → chunks → embeddings → vector upsert)
  - `GET /ask?p=...` (question → embedding → vector search → Gemini answer)
  - `GET /ask?p=...&stream=1` (SSE status/token/final events)

---

## Technical stack (current in code)

### Web

- Next.js `16.2.4`
- React `19.2.4`
- Tailwind v4

### API

- Express 5 + TypeScript
- PDF parsing: `pdf-parse` (buffer-based parsing)
- Chunking: `@langchain/textsplitters` (recursive character splitter)
- Embeddings + LLM: `@langchain/google-genai`
- Vector DB: **Pinecone** (`@pinecone-database/pinecone`)
- Streaming transport: SSE from Express endpoint

---

## Ingestion pipeline (implemented)

Goal: upload a PDF, extract text, chunk it, embed it, store vectors.

- Upload: `multer` (`multipart/form-data`, field name `file`)
- Session header: `x-session-id` (required)
- Parsing: `pdf-parse` from in-memory buffer
- Chunking: recursive character splitter
  - chunk size: 1000 chars
  - overlap: 200 chars
- Embedding: Google embeddings
- Storage: Pinecone upsert into `namespace(sessionId)` with metadata `{ sessionId, text }`

Important gaps to close (to reach “production-grade”):

- Data lifecycle/cleanup policy (TTL / deletion) for vectors per session
- Robust validation + structured error handling
- Observability/tracing
- Rate-limit handling + retries/backoff + model fallback
- Security hardening (file size/type limits, CORS policy, etc.)

---

## Retrieval pipeline (implemented baseline)

Goal: answer questions using session-isolated vector search + LLM generation.

- Embed question
- Query Pinecone `namespace(sessionId)` topK results
- Build context from retrieved chunk texts
- Route intent (`qa`, `explain_topic`, `mcq`, `question_patterns`)
- Use grounded answering policy (context gate to reduce hallucination)
- Stream answer tokens via SSE when requested
- Apply model fallback ladder and retry strategy

Current fallback ladder:

1. `gemini-2.0-flash`
2. `gemini-2.0-flash-lite`
3. `gemini-3-flash-preview`
4. `gemini-3.1-flash-lite-preview`

Behavioral policy:

- If context is insufficient and outside knowledge is **not** allowed, API returns `needConsent: true`
- If outside knowledge is allowed, answer can be generated from non-PDF knowledge
- Frontend remembers this consent per session (Option B)

---

## Current file structure (important parts)

```text
rag-application/
  api/
  web/
  CODEBASE_OVERVIEW.md
  PROJECT_SPEC.md
  package.json
```

---

## UI conventions (frontend)

- Neutral “enterprise” zinc palette + light/dark support
- Theme toggle uses class-based `html.dark` / `html.light` with persistence
- UI primitives in `web/src/components/ui/*`
- Chat UI includes outside-knowledge consent prompt with session memory

