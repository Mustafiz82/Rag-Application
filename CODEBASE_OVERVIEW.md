# Codebase overview (read this first)

Last updated: 2026-04-21

This repo is a **Node.js monorepo** using **npm workspaces** with two packages:

- `web/`: Next.js + React frontend (App Router)
- `api/`: Express + TypeScript backend (RAG API)

---

## How to run

From the repo root:

- `npm run dev`: runs **API + Web** concurrently
- `npm run build`: builds **API then Web**

Workspace scripts:

- `api`: `npm run dev --workspace=api` starts `tsx watch index.ts`
- `web`: `npm run dev --workspace=web` starts `next dev`

---

## Main entry points (actual runtime)

### Backend (API)

- Entry: `api/index.ts`
- Listens: `http://localhost:5000`

Implemented routes today:

- `GET /`: basic health response
- `POST /ingest`: upload a PDF (`multipart/form-data` field name: `file`)
  - requires header `x-session-id`
  - parses PDF from memory buffer
  - chunks + embeds + upserts vectors
- `GET /ask?p=...`: query the RAG system
  - requires header `x-session-id`
  - supports JSON mode and SSE mode (`&stream=1` or `Accept: text/event-stream`)
  - SSE emits `status`, `token`, `final`, `error`
  - supports header `x-allow-outside-knowledge: 1|0`

Vector store + models in code today:

- **Vector DB**: Pinecone (namespace = `sessionId`)
- **Embeddings**: Google embeddings (see `api/embed.ts` / `api/query.ts`)
- **Chat model strategy**: Gemini fallback ladder + retry/timeout behavior (see `api/query.ts` and `api/llm.ts`)

Current model ladder:

- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`
- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite-preview`

Runtime reliability behaviors:

- Per-model streaming attempts use timeout-based failover in `streamAnswerWithRagPolicy`
- 429/rate-limit errors skip same-model retries and move to next model
- Non-stream fallback exists as a last resort when stream path fails

### Frontend (Web)

- App Router root: `web/src/app/`
- Home page: `web/src/app/page.tsx`
- Chat page: `web/src/app/chat/page.tsx`
- Chat client consumes SSE and renders partial tokens progressively
- Session-scoped consent memory for outside-knowledge mode lives in localStorage keyed by session id

---

## Repo-specific rule (frontend)

Read `web/AGENTS.md` before changing the frontend. It notes that this project’s Next.js expectations may differ from defaults and recommends consulting local docs under `web/node_modules/next/dist/docs/` when needed.

`web/CLAUDE.md` currently just references `AGENTS.md`.
