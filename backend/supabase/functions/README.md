# Edge Functions

| Function | Route (deployed) | Spec phase |
|----------|------------------|------------|
| `analyze-agreement` | `POST /functions/v1/analyze-agreement` | Phase 5 — body `{ "agreement_id": "uuid" }` |
| `rental-chatbot` | `POST /functions/v1/rental-chatbot` | Phase 5 — body `{ "message": "...", "context?": "..." }` |

Both require `Authorization: Bearer <user JWT>` except chatbot allows anonymous replies when no key is configured.

OCR/text extraction for agreements should run in a separate upload handler (Next.js API route or additional function) that writes `extracted_text` before calling `analyze-agreement`.

Local serve:

```bash
cd backend
cp .env.example .env.local
# fill SUPABASE_* and OPENAI_API_KEY
npm run functions:serve
```
