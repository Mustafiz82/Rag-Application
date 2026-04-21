# Codebase overview (read this first)

This repo is a **Node.js monorepo** using **npm workspaces** with two packages:

- `web/`: Next.js + React frontend (App Router)
- `api/`: Express + TypeScript backend (intended RAG API)

If you only read one file to get oriented, read this one.

---

## How to run

From the repo root:

- `npm run dev`: runs **API + Web** concurrently
- `npm run build`: builds **API then Web**

Workspace scripts:

- `api`: `npm run dev --workspace=api` starts `tsx watch index.ts`
- `web`: `npm run dev --workspace=web` starts `next dev`

---

## Repo-specific rule (important)

Read `web/AGENTS.md` before changing the frontend. It states:

- **This is NOT the Next.js you know** (breaking changes vs typical Next)
- Use the repo’s local Next docs under `web/node_modules/next/dist/docs/` when in doubt

`web/CLAUDE.md` currently just references `AGENTS.md`.

---

## Main entry points (actual runtime)

### Backend (API)

- **Entry file**: `api/index.ts`
- **Dev command**: `tsx watch index.ts`
- **Current behavior**: Express server, CORS + JSON middleware, `GET /` health route, listens on `:5000`

Notes:

- Dependencies are already installed for typical RAG ingestion needs (`mongodb`, `multer`, `pdf-parse`, `dotenv`) but **they are not wired up yet** in code.

### Frontend (Web)

- **App Router root**: `web/src/app/`
- **Root layout**: `web/src/app/layout.tsx` (metadata, fonts, global CSS)
- **Home page**: `web/src/app/page.tsx` (still template content)
- **Global CSS**: `web/src/app/globals.css` (Tailwind v4 import + CSS variables theme)

---

## Key configuration files

### Root

- `package.json`: workspaces + scripts that orchestrate both apps
- `package-lock.json`: workspace lock

### API

- `api/package.json`: dev/build/start scripts
- `api/tsconfig.json`: outputs compiled JS to `api/dist/` for `npm run start`

### Web

- `web/package.json`: Next scripts and deps
- `web/tsconfig.json`:
  - path alias: `@/*` → `web/src/*`
  - uses `moduleResolution: "bundler"`
- `web/next.config.ts`: Next config (currently empty)

---

## What exists today vs what’s missing (RAG reality check)

### Exists today

- Web app shell (Next App Router) with basic Tailwind styling
- API server shell (Express) with a single health route

### Missing today (common “RAG app” pieces)

- **Ingestion endpoints** (upload PDFs, parse, chunk)
- **Embedding generation** (no embedding provider integrated)
- **Vector storage/index** (MongoDB driver present, but no schema/collections/indexing code)
- **Query/retrieval endpoint** (no “ask” route used by the web app)
- **Web UI flow** for upload + chat/search + results

---

## Recommended module structure (when you start building real RAG features)

Right now everything is in `api/index.ts`. As soon as you add real functionality, it’s worth splitting into:

### API (suggested)

- `api/src/server.ts`: create app, middleware, listen
- `api/src/routes/health.ts`: `GET /`
- `api/src/routes/ingest.ts`: upload + parse + store
- `api/src/routes/query.ts`: query + retrieve + respond
- `api/src/services/pdf.ts`: PDF text extraction (`pdf-parse`)
- `api/src/services/chunking.ts`: chunking logic
- `api/src/services/mongo.ts`: Mongo connection + helpers
- `api/src/repositories/*`: persistence (docs/chunks/embeddings)
- `api/src/env.ts`: env validation (`dotenv` + schema)

### Web (suggested)

- `web/src/app/page.tsx`: “home” (chat/search)
- `web/src/app/upload/page.tsx`: upload screen
- `web/src/components/*`: UI components
- `web/src/lib/api.ts`: typed calls to backend (`fetch`)

---

## Where to start reading before making changes

If you’re changing…

- **Backend behavior**: `api/index.ts`, then `api/package.json`, then `api/tsconfig.json`
- **Frontend UI**: `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`
- **Build/dev behavior**: root `package.json`, then `web/package.json` / `api/package.json`

