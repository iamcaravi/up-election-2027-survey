# Phase 19A final import report

Completed: 2026-09-09

## Result

- Candidates before: 353
- Approved INCUMBENT candidates imported: 49
- Candidates after: 402
- Protected existing candidates changed: 0
- Remaining unresolved seats: 1 (Ghosi #354)
- Party created: exactly one canonical `Jansatta Dal Loktantrik Party`
- Parties after: 11
- Constituency master records changed: 0

## Pre-write dry-run and import

The approved 49-row input was passed to the existing `runMlaImport()` implementation.

| Run | Creates | Updates | Unchanged | Needs review |
| --- | ---: | ---: | ---: | ---: |
| Pre-write dry-run (`commit: false`) | 49 | 0 | 0 | 0 |
| Approved write (`commit: true`) | 49 | 0 | 0 | 0 |
| Immediate second run | 0 | 0 | 49 | 0 |

Before and after the write, the protected 353 candidates were compared across ID, name, election, constituency, party, status, source notes, source URLs, and verified state. No protected row changed.

## Party and exceptional seats

- One Party row was created with canonical name and short name `Jansatta Dal Loktantrik Party`, slug `jansatta-dal-loktantrik-party`, and no logo URL or invented optional metadata.
- Babaganj #245: Vinod Saroj, `INCUMBENT`, HIGH confidence, `verified: false`.
- Kunda #246: Raghuraj Pratap Singh, `INCUMBENT`, HIGH confidence, `verified: false`.
- Both records retain their official Uttar Pradesh Legislative Assembly member-profile URL and import source note.
- Ghosi #354: no `INCUMBENT` candidate was created; the public page remains in its graceful empty state.

## Final database counts

```json
{
  "states": 1,
  "elections": 1,
  "districts": 75,
  "constituencies": 403,
  "surveys": 403,
  "surveyQuestions": 2821,
  "surveyOptions": 18941,
  "candidates": 402,
  "surveyResponses": 0,
  "parties": 11
}
```

All `INCUMBENT` candidate IDs have zero matching `SurveyOption.candidateRef` rows.

## Automated checks

- `npm run typecheck`: pass
- Changed-file ESLint: pass
- Focused MLA source validation: 12/12 pass
- `npm run build`: pass (Next.js 16.3.4; all 43 static pages generated)
- `npm test`: not green because the known temporary SQLite test-database setup problem recurred. Result: 14 passed and 106 setup-cascade failures. The root error is `npx prisma db push --skip-generate` failing with `Error: Schema engine error:` at `tests/helpers/testDb.ts:15`; this is setup/infrastructure, not a Phase 19A assertion failure.

## Browser QA

- `/admin/candidates`: party filter contains one Jansatta Dal Loktantrik Party option; combined Pratapgarh + party + Sitting MLA filters return exactly Vinod Saroj/Babaganj and Raghuraj Pratap Singh/Kunda.
- Mau + Sitting MLA returns the three other Mau incumbents and no Ghosi row.
- Babaganj public page shows Vinod Saroj as Sitting MLA / HIGH; its 2027 survey does not show Vinod Saroj and displays the graceful Other-only empty state.
- Kunda public page shows Raghuraj Pratap Singh as Sitting MLA / HIGH; its 2027 survey does not show him and displays the same graceful empty state.
- Majhawan public page shows Shuchismita Maurya as Sitting MLA / HIGH; its 2027 survey excludes her and displays the graceful empty state.
- Ghosi public page says no candidates are listed; its survey remains available with the Other-only empty state.
- Homepage light/dark toggle changed the rendered theme correctly. At the active 887 px browser viewport, document width stayed within the viewport with no horizontal overflow. The CUA browser surface did not expose viewport resizing, so the requested exact 1440/1280/1024/768/390/360 matrix could not be truthfully executed; build and the active responsive viewport showed no regression, and the homepage source was unchanged.

## Repository safety

- Protected source artifacts, Prisma schema, constituency master data, and homepage are unchanged.
- HEAD remains `ff21efd`.
- No commit and no push were performed.
