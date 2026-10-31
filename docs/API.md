# API contracts

All web APIs return JSON unless exporting CSV. Errors use `{ "error": { "code": "...", "message": "..." } }`. Validation failures may include field issues. Responses are private/no-store. Mutations require a matching `Origin`; authentication is verified with Supabase `getUser()`, and privileged handlers check the database profile role.

| Method / path                 | Access                      | Behavior                                                                          |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| GET /api/status               | Public                      | Database configuration and real inference readiness booleans                      |
| GET, PATCH /api/profile       | Signed in                   | Read/update name, preferred language, region only                                 |
| GET /api/regions              | Signed in                   | Administrative region catalog                                                     |
| GET /api/diagnoses            | Owner                       | 24-item pagination, crop/disease search, chronological sort                       |
| POST /api/diagnoses           | Signed in                   | Multipart `file` and UUID `request_key`; decode, sanitize, upload, infer, persist |
| GET /api/diagnoses/:id        | Owner or authorized officer | Result and 5-minute signed image URL                                              |
| POST /api/reports             | Diagnosis owner             | Diagnosis UUID, region UUID, notes, explicit consent, optional coordinate pair    |
| GET /api/reports              | Officer/admin               | Authorized reports filtered by UTC dates, region, exact disease, status           |
| GET /api/reports/:id          | Owner or authorized officer | Report, prediction, image, review history                                         |
| PATCH /api/reports/:id        | Authorized officer          | Expected version, decision, notes; atomic review + audit                          |
| GET /api/insights?region=UUID | Signed in                   | Suppressed verified aggregates and officer-confirmed alert labels                 |
| GET, POST /api/alerts         | Officer/admin               | Latest 200 authorized investigations; open with minimum evidence                  |
| GET, PATCH /api/alerts/:id    | Authorized officer          | Linked evidence/audit; confirm or dismiss with decision notes                     |
| GET /api/export               | Officer/admin               | Same report filters; spreadsheet-safe CSV without notes/coordinates/owner IDs     |

Report queries reject results of 1,000 or more and ask for narrower filters rather than silently returning partial analytics. Diagnosis history is paginated. Monitoring thresholds are defined in `lib/analytics.ts` and enforced independently by `open_alert` in the migration; update and test both together.

## Inference v1

`GET /health`: process health. `GET /ready`: readiness and a non-sensitive reason code. `POST /v1/predict`: multipart image with `X-API-Key`. The key is verified before parsing uploads. Maximum raw service request: 9 MiB; image: 8 MiB, 20 megapixels, JPEG/PNG/WebP, one frame, dimensions at least 64×64.

Successful responses use `schema_version: "1.0"`, `status: "success"`, `model_version`, a `prediction` containing crop/disease/confidence, up to four alternatives, quality warnings, `review_recommended`, `abstained`, and an uncertainty note. The web application validates the response with Zod before persistence. No prediction example in this document represents actual inference.

Service errors use FastAPI's `detail` object: `unauthorized` (401), `request_too_large`/`image_too_large` (413), `invalid_image` (422), `inference_failed` (502), and `service_unconfigured`/`model_unconfigured`/`model_load_failed` (503). Internal exceptions and filesystem paths are not returned.
