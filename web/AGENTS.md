# Frontend agent rules (web)

Last updated: 2026-04-21

## Read this before changing the frontend

This repo uses Next.js `16.2.4` + React `19.2.4` with App Router under `web/src/app/`.

If you are unsure about a Next.js behavior, consult the local docs under:

- `web/node_modules/next/dist/docs/`

## Project conventions

- One component per `.tsx` file (see `.cursor/rules/web-ui-structure.mdc`)
- Pages (`web/src/app/**/page.tsx`) should be composition-only (prefer importing components)

## Where to start

- Layout + globals: `web/src/app/layout.tsx`, `web/src/app/globals.css`
- Home: `web/src/app/page.tsx`
- Chat: `web/src/app/chat/page.tsx`, `web/src/components/chat/*`

## Chat integration notes

- Chat requests use SSE (`/ask?stream=1`) and parse `status` / `token` / `final` / `error` events.
- Keep session-scoped behavior keyed by `sessionId` for user preferences (outside-knowledge consent).
- Do not regress hydration behavior around theme/UI controls; prefer client-only rendering when SSR mismatch appears.
