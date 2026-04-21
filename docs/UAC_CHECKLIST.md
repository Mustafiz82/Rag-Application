# UAC Checklist

User Acceptance Criteria checklist for current implementation state.

---

## A. Core Product Behavior

- [x] User can upload a PDF.
- [x] User can ask questions against uploaded PDF context.
- [x] Session-scoped isolation is enforced with `x-session-id`.
- [x] Retrieval uses Pinecone namespace per session.

---

## B. Streaming + UI Responsiveness

- [x] Backend supports SSE query streaming (`/ask?stream=1`).
- [x] Frontend consumes SSE stream.
- [x] Tokens are rendered incrementally.
- [x] Stream status labels are shown in UI.

---

## C. Reliability / Engineering

- [x] Retryable error detection (429/5xx/network classes).
- [x] Model fallback ladder implemented.
- [x] Rate-limit aware model switching.
- [x] Timeout for stream startup per model attempt.
- [x] Non-stream fallback path exists.

---

## D. Grounding / Hallucination Control

- [x] Context-gated answer policy exists.
- [x] Insufficient context can trigger `needConsent`.
- [x] Outside-knowledge mode is explicit and session-scoped.

---

## E. UX / Output Formatting

- [x] Markdown rendering enabled for assistant messages.
- [x] Inline and block code formatting enabled.
- [x] Outside-knowledge consent prompt implemented.

---

## F. Documentation

- [x] Root README with architecture and workflows.
- [x] `.env.example` with required variables.
- [x] API contract documented.
- [x] Fallback and reliability strategy documented.

---

## G. Test Automation

- [ ] Unit tests committed
- [ ] Integration tests committed
- [ ] Coverage thresholds enforced in CI

> Current repo status: manual verification + lint/build checks are present; automated tests are planned.

