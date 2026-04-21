# Architecture Decisions

This document records key engineering decisions and trade-offs for the current RAG implementation.

---

## ADR-001: Session Isolation via Header (`x-session-id`)

### Decision

Use a required request header (`x-session-id`) to isolate all ingest/retrieval operations.

### Why

- Keeps architecture stateless at API layer.
- Prevents cross-user retrieval collisions.
- Works without full auth for prototype phase.

### Trade-offs

- Session lifecycle and cleanup policy must be handled deliberately.
- Header misuse from client can still cause user mistakes if IDs are not managed carefully.

---

## ADR-002: Pinecone Namespace per Session

### Decision

Store vectors under Pinecone namespace = session ID.

### Why

- Fast isolation boundary.
- Simple retrieval query path.
- Avoids complex metadata filters for MVP.

### Trade-offs

- Many namespaces over time can require operational housekeeping.

---

## ADR-003: SSE over WebSockets for Response Streaming

### Decision

Use Server-Sent Events for chat streaming (`status`, `token`, `final`, `error`).

### Why

- Simpler one-way streaming over standard HTTP.
- Easy client integration with incremental rendering.
- Natural fit for token stream UX.

### Trade-offs

- One-way channel only.
- Requires careful event formatting and parser handling.

---

## ADR-004: Context-Gated Answer Policy

### Decision

Gate answer generation based on retrieval quality/context sufficiency before model response.

### Why

- Reduces hallucination risk.
- Enables deterministic consent path when context is weak.

### Trade-offs

- Needs threshold tuning over time.
- Overly strict thresholds can cause false "insufficient context" outcomes.

---

## ADR-005: Outside Knowledge by Explicit Consent (Session Scoped)

### Decision

If context is insufficient, return `needConsent` unless user has already allowed outside mode for current session.

### Why

- Keeps behavior transparent.
- Aligns with trust and control principles.
- Supports "Option B" user preference pattern.

### Trade-offs

- Adds one extra UI step on first outside answer.

---

## ADR-006: Fallback Model Ladder + Timeout-Based Switching

### Decision

Use ordered model fallback with retry classes and per-attempt stream timeout.

### Why

- Handles real-world throttling/rate-limits.
- Prevents multi-minute stalls on one model.
- Improves probability of successful answer under provider load.

### Trade-offs

- Responses may vary by model family.
- Requires careful telemetry for tuning.

---

## ADR-007: Markdown Rendering for Assistant Output

### Decision

Render assistant output as Markdown with GFM and styled code blocks.

### Why

- Better readability for structured answers.
- Supports technical/function output format naturally.

### Trade-offs

- Requires sanitation-aware rendering practices if content sources expand.

