# Test Evidence

This file captures current verification evidence for the project.

---

## 1) Static / Build Checks

### Web lint

```bash
npm run lint --workspace=web
```

Result: ✅ pass

### API build

```bash
npm run build --workspace=api
```

Result: ✅ pass

---

## 2) Functional Verification

## Ingestion

- Endpoint: `POST /ingest`
- Header: `x-session-id`
- Expected result: upload success + `chunkCount`

Sample response:

```json
{ "success": true, "fileName": "Surface tension Updated.pdf", "chunkCount": 26 }
```

## Streaming query

- Endpoint: `GET /ask?p=...&stream=1`
- Headers:
  - `x-session-id`
  - `Accept: text/event-stream`

Observed event pattern:

1. `status:start`
2. `status:retrieving`
3. `status:model_start`
4. `token` (multiple)
5. `final`

---

## 3) Reliability / Fallback Evidence

Observed and handled:

- Model rate limit errors (`429`)
- Automatic model switching in fallback ladder
- Stream startup timeout handling to reduce long waits

Result:

- Query still reaches `token` and `final` after model switching when earlier models fail.

---

## 4) UI Verification

- Status labels visible during generation
- Token-by-token updates visible
- Markdown output rendering enabled
- Code/inline function formatting enabled
- Consent UI shown for outside-knowledge mode when needed

---

## 5) Coverage Status

Automated tests are not yet committed in this repository.

Current status:

- Unit tests: ⏳ planned
- Integration tests: ⏳ planned
- Coverage threshold enforcement: ⏳ planned

Next step:

- Add API unit + integration suites and publish coverage report in CI.

