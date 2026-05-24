# SpendSense CSV Upload — Production Architecture

## 1. System overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15 App Router)                               │
│  /import → CsvUploadWizard                                      │
│    1. File drop + validation (size, type, structure)          │
│    2. Preview (100 rows) + ColumnMapperUi                       │
│    3. validateMappedRows() → inline errors                      │
│    4. Confirm → demo localStorage OR POST /api/imports          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  API (Node.js runtime)                                          │
│  POST /api/imports          → batch insert + job log            │
│  GET  /api/imports          → upload history                    │
│  GET  /api/imports/:id      → job status                        │
│  GET  /api/imports/:id/errors → error CSV download              │
│  DELETE /api/imports/:id    → rollback by import_batch_id       │
│  GET/POST /api/mapping-templates                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Postgres (Supabase)                                            │
│  csv_import_jobs | csv_import_errors | csv_column_mapping_*     │
│  spend_transactions.import_batch_id                             │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Database schema

See `supabase/migrations/001_csv_import_system.sql`.

| Table | Purpose |
|-------|---------|
| `csv_import_jobs` | Upload metadata, status, counts, column_mapping JSON |
| `csv_import_errors` | Row-level errors for reports |
| `csv_column_mapping_templates` | Per-user saved mappings |
| `spend_transactions.import_batch_id` | Rollback scope |

**Statuses:** `pending` → `validating` → `processing` → `completed` \| `partial` \| `failed` \| `rolled_back`

## 3. Key libraries

| Layer | Library | Why |
|-------|---------|-----|
| Client parse | Papa Parse (existing) | Fast browser preview |
| Server parse | csv-parse stream (scale path) | Streaming for 50MB+ |
| Dates/amounts | date-fns, currency.js | UK formats |
| Supplier match | Fuse.js | Fuzzy canonical names |
| Queue (scale) | **BullMQ + Redis** | Async jobs, retries |
| Storage (scale) | **Supabase Storage** | Retain originals |
| Validation | Custom + optional Zod | Row-level actionable errors |

## 4. Error response format

```json
{
  "importId": "uuid",
  "status": "partial",
  "totalRows": 5000,
  "successRows": 4820,
  "errorRows": 180,
  "skippedRows": 0,
  "errors": [
    {
      "rowNumber": 42,
      "columnName": "Date",
      "fieldKey": "date",
      "message": "Invalid date format. Expected YYYY-MM-DD, DD/MM/YYYY, or similar.",
      "rawValue": "32/13/2026"
    }
  ]
}
```

Error report CSV columns: `row_number`, `column_name`, `field`, `message`, `raw_value`.

## 5. Column mapping rules

Implemented in `src/lib/import/column-mapper.ts`:

- `vendor`, `supplier`, `merchant` → **supplier**
- `amount`, `total`, `debit`, `credit` → **amount**
- `date`, `txn_date` → **date**
- `pub`, `venue`, `site` → **pub**

Templates persisted via `/api/mapping-templates` (Supabase) or `localStorage` (demo).

## 6. Security

| Control | Implementation |
|---------|----------------|
| Auth | Supabase session on API routes (`api-auth.ts`) |
| Rate limit | In-memory per user (swap Redis for prod cluster) |
| File type | Extension + MIME allowlist |
| Content | Reject binary/null bytes |
| Sanitize | `sanitize.ts` strips control chars, max length |
| RLS | All import tables scoped to `auth.uid()` |

## 7. Performance & scalability

| Concern | Current MVP | Enterprise path |
|---------|-------------|-----------------|
| 50MB files | Client read + server JSON batches | Stream `csv-parse` + Storage |
| 100k rows | `MAX_IMPORT_ROWS` cap | Chunked queue workers |
| Blocking | Sync batch insert 1k rows | BullMQ `processImportJob` |
| Progress | UI progress bar | WebSocket / poll `GET /imports/:id` |

Use Next.js `after()` or BullMQ worker:

```typescript
// Future: after(() => processImportFromStorage(importId));
```

## 8. File map

```
src/lib/import/
  types.ts           — shared types
  constants.ts       — limits
  fields.ts          — system field defs
  column-mapper.ts   — auto-map + validate mapping
  validator.ts       — row-level validation
  parse-rows.ts      — preview parser
  error-report.ts    — CSV export
  file-security.ts   — upload guards
  process-job.ts     — batch DB insert
  rate-limit.ts      — API throttling
  api-auth.ts        — user resolution

src/components/import/
  csv-upload-wizard.tsx
  column-mapper-ui.tsx
  preview-table.tsx

src/app/api/imports/...
src/app/import/page.tsx
```

## 9. UX flows

1. Download `spend_template.csv` or `pub_sample_20.csv`
2. Upload → auto-suggest mapping
3. Adjust dropdowns → save template (optional)
4. Validate → see row errors highlighted
5. Partial import allowed
6. Download error report
7. History via `GET /api/imports` (Supabase mode)
8. Rollback via `DELETE /api/imports/:id`

## 10. Deployment checklist

1. Run `supabase/schema.sql` then `migrations/001_csv_import_system.sql`
2. Set `DEMO_MODE=true` for local demo; disable for production API
3. Add Redis + BullMQ when imports exceed ~30s
4. Enable Supabase Storage bucket `csv-uploads` for raw file retention
5. Configure CDN rate limits / WAF on `/api/imports`
