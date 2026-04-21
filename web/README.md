# Web (Next.js)

Last updated: 2026-04-21

This is the **frontend** for the RAG application (monorepo workspace `web/`).

## Stack

- Next.js `16.2.4` (App Router)
- React `19.2.4`
- Tailwind CSS v4
- UI components live under `web/src/components/*`

## How to run (recommended)

From the repo root:

```bash
npm run dev
```

This runs both workspaces concurrently:
- API: `https://rag-application-3w9w.onrender.com/`
- Web: `http://localhost:3000`

## Run only the web app

```bash
npm run dev --workspace=web
```

## Key routes / entry points

- App Router root: `web/src/app/`
- Home: `web/src/app/page.tsx`
- Chat UI: `web/src/app/chat/page.tsx`

## Chat behavior (current)

- Uses session id from localStorage and sends `x-session-id` to API
- Calls `GET /ask?p=...&stream=1` and consumes SSE events:
  - `status` for progress updates
  - `token` for incremental text rendering
  - `final` for final structured response
  - `error` for failures
- Handles consent flow when API returns `needConsent: true`
- Remembers "allow outside knowledge" per session (Option B)

## Repo-specific note (important)

Read `web/AGENTS.md` before making frontend changes. It documents project-specific Next.js constraints and guidance.
