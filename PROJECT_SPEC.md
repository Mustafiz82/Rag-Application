# Project spec (source of truth)

This file is the **single reference** for what we’re building and how the repo is structured.

---

## What we’re building

A **production-grade, session-based RAG (Retrieval-Augmented Generation) agent**:

- Users **upload a PDF** and then **chat with it**
- **No authentication** required
- **Privacy-first**: user data is **auto-purged** after inactivity
- **Resilient**: retries/backoff + model fallback + streaming responses
- **Stateless** API: session isolation via request header, not server memory

---

## Current status (repo)

- **Architecture**: monorepo via **NPM Workspaces**
- **Packages**:
  - `api/`: Express + TypeScript (ES Modules)
  - `web/`: Next.js + Tailwind + TypeScript
- **Deployment targets** (intended):
  - Backend: Render
  - Frontend: Vercel
- **Database** (intended): MongoDB Atlas with **Vector Search** enabled

---

## Technical stack (target)

- **Language**: TypeScript (ES Modules)
- **LLM & Embeddings**:
  - Generation: Google Gemini 1.5 Flash
  - Embeddings: `text-embedding-004` (768 dimensions)
- **PDF processing**: `pdf-parse`
- **Orchestration**: LangChain.js (chunking + prompt management)
- **Vector DB**: MongoDB Atlas Vector Search
- **Observability**: LangSmith tracing

---

## Ingestion pipeline (“Vectorisation”)

Goal: upload a PDF, extract text, chunk it, embed it, store vectors, and ensure cleanup.

- **Upload**: `multer` handles `multipart/form-data` (PDF)
- **Parsing**: `pdf-parse` extracts text from the in-memory buffer
- **Chunking**: Recursive character splitter
  - chunk size: 1000 chars
  - overlap: 200 chars
- **Embedding**: convert chunks → **768-dim** vectors using Google AI
- **Storage schema** (MongoDB):
  - `{ sessionId, text, embedding, createdAt }`
- **Cleanup**:
  - MongoDB **TTL index** on `createdAt`
  - expiration: **1 hour**
- **Data integrity requirement**:
  - any PDF temp files must be deleted **immediately** after vectorization

---

## Retrieval pipeline (“RAG”)

Goal: answer questions using session-isolated vector search + LLM generation + streaming.

- **Session isolation**:
  - each request includes `x-session-id` (UUID)
  - all DB queries filter by `sessionId` to prevent cross-user data leakage
- **Search**:
  - MongoDB `$vectorSearch` for the user’s embedded question
- **Resilience**:
  - LLM call uses **exponential backoff** retries for 429/5XX
  - **model fallback** strategy (e.g. Pro → Flash) when needed
- **Streaming**:
  - responses sent via **Readable Streams / SSE** to Next.js for real-time typing
- **Scalability**:
  - stateless API (no per-user in-memory storage)

---

## Frontend UI scope (current step)

This repo currently contains **UI-only** work for the upload screen.

- No backend integration yet
- No real upload/vectorization logic yet
- No API changes required for the UI-only step

---

## Current file structure (important parts)

### Monorepo layout

```text
rag-application/
  api/
  web/
  CODEBASE_OVERVIEW.md
  PROJECT_SPEC.md
  package.json
```

### Web UI (added for enterprise upload screen)

```text
web/src/
  app/
    page.tsx
    chat/
      page.tsx
  components/
    chat/
      ChatComposer.tsx
      ChatHeaderStrip.tsx
      ChatMessageList.tsx
      ChatPreUpload.tsx
      ChatScreen.tsx
    navigation/
      AppTopBar.tsx
    session/
      NewSessionButton.tsx
    theme/
      ThemeInitScript.tsx
      ThemeToggle.tsx
    ui/
      Button.tsx
      Card.tsx
      CardBody.tsx
      CardHeader.tsx
      Container.tsx
    upload/
      PdfDropzone.tsx
```

---

## UI conventions chosen (so it stays consistent)

- **Theme**: neutral “enterprise” zinc palette + light/dark (`dark:`) support
- **Theme toggle**: class-based (`html.dark` / `html.light`) with localStorage persistence
- **Icons**: Ionicons via `react-icons/io5` (no inline SVGs)
- **Components**: small primitives under `web/src/components/ui/*`

---

## Cursor rules (web UI)

- `.cursor/rules/web-ui-structure.mdc`: enforce “one component per file” for `web/src/**/*.tsx`

