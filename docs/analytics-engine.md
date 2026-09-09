# Premium Analytics Engine

Internal documentation for `src/lib/premium-analytics.ts` and
`src/lib/analytics-privacy.ts` — the aggregate-only analytics domain layer
behind the future paid Premium Analytics product (Phase 16).

This is the **engine only**. No payment, entitlement, checkout, or final
dashboard exists yet — see "Future premium customer model" below.

## Audit finding: MLA performance / re-election preference

The platform's documented survey concept (Phase 9 spec) lists "MLA
performance" and "re-election preference" as question types. Auditing the
actual seed data (`prisma/seed.ts` → `src/lib/survey-template.ts`) confirms
**no survey currently has these questions** — every seeded survey has
exactly 7 questions: `candidate_choice`, `party_preference`, `top_issue`,
`age_group`, `gender`, `social_category`, `religion`.

The engine still supports `mla_performance` and `reelection_preference` as
allowlisted dimension keys (`CROSSABLE_DIMENSIONS` in `premium-analytics.ts`)
for forward compatibility — `SurveyQuestion.key` is a free-form string, so
nothing in the schema prevents a future survey from having one. Requesting
either dimension for a survey that lacks it simply returns `null`, exactly
like requesting any other question a survey doesn't have. **No question
data was fabricated to make this phase's checklist "pass."**

## Eligible responses

A `SurveyResponse` is eligible for analytics if and only if
`status === "VALID"` (`ELIGIBLE_RESPONSE_STATUS` in `analytics-privacy.ts`).
`FLAGGED` and `REJECTED` responses (duplicate/abuse-detected submissions —
see `src/app/api/surveys/[surveyId]/responses/route.ts`) are excluded
everywhere, exactly matching the definition the public results page
(`src/lib/analytics.ts`) has always used. There is exactly one definition
of "eligible" in the codebase; every aggregation function goes through it.

## Suppression policy

`getMinCellSize()` in `analytics-privacy.ts` is the **one** place the
minimum-cell-size threshold is defined — it reads the `MIN_ANALYTICS_GROUP_SIZE`
site setting, falling back to `MIN_ANALYTICS_GROUP_SIZE_DEFAULT = 30`
(`src/lib/enums.ts`). Both the public results calculation and the premium
engine call this same function; the number `30` is not hard-coded anywhere
else.

> **30 respondents is an application-level privacy suppression threshold
> chosen by this platform. It is NOT a claim that Indian law provides any
> legal "safe harbour" at 30 respondents.** It exists solely to reduce the
> risk that a published breakdown could be used to infer an individual
> respondent's answers from a very small group.

Suppression is applied in the domain layer, before any route or UI code
runs — there is no code path (payment or otherwise) that can request
"the real numbers anyway." A suppressed distribution/group returns:

```ts
{ suppressed: true, minRequired: 30, buckets: [] }   // or breakdown: []
```

with no count included anywhere else in the payload that could let a client
reconstruct the hidden number (see "Privacy leak review" below).

Two layers, applied together:

1. **Whole-distribution / whole-group suppression.** A standalone
   distribution (`getQuestionDistribution`) suppresses its **entire**
   breakdown when the question's total answered count is below the
   threshold — exactly the `sufficientSample` behavior the public results
   page has always used (`src/lib/analytics.ts`'s
   `QuestionResult.sufficientSample`). A cross-tab (`getCrossTab`)
   suppresses **per group** instead: a large survey's "General"
   social-category group might have 400 respondents (breakdown shown)
   while its "ST" group has 12 (breakdown hidden), each group's own total
   deciding its own suppression independently. This generalizes the exact
   algorithm the public results page's demographic breakdown already used
   (`getConstituencyDemographicBreakdown`).
2. **Per-bucket suppression**, applied on top of (1). Even when a
   distribution's or group's *overall* total clears the threshold, any
   individual bucket within it whose own count is below the threshold is
   suppressed on its own (`buildBucket` in `premium-analytics.ts`) — an
   otherwise-large "Social Category Distribution" must not leak an exact
   small "ST: 2" count just because the question overall had plenty of
   respondents. A suppressed bucket is `{ key, label, suppressed: true }`
   with no `count`/`pct` field at all (never a zeroed-out count).

   **Known limitation** (basic single-cell suppression, not full
   statistical disclosure control): if exactly one bucket in an otherwise
   fully-visible distribution is suppressed, its count is algebraically
   reconstructible from `total` minus the sum of the visible buckets. Full
   secondary suppression (hiding an additional cell to prevent this) is
   not implemented in this foundation phase — flagged as a follow-up
   hardening item, not silently ignored.

## Percentage rounding

`roundPct(count, total)` in `analytics-privacy.ts` is the one rounding
function: round to one decimal place
(`Math.round((count/total)*1000)/10`), matching the formula the public
results page has always used. **Percentages in a breakdown are never
redistributed to force an exact 100.0 total** — a harmless ±0.1 rounding
artifact from independently-rounded values is preferable to silently
adjusting a real count to make a UI total look clean.

## Missing vs. "Prefer not to say"

These are kept distinct, per the schema's actual shape:

- **Missing** — a respondent skipped an optional question
  (`allowSkip: true`). No `SurveyAnswer` row exists for that response/question
  pair. Missing respondents are simply absent from every group tally; they
  are never coerced into "General", "Hindu", "Male", or any other default
  category.
- **"Prefer not to say"** — an explicit `SurveyOption` (key
  `prefer_not_to_say`) that a respondent actively selected. This produces a
  real `SurveyAnswer` row and is counted as its own bucket like any other
  option — the premium engine does not hide it (unlike the public results
  page, which omits it from its candidate/party display for a cleaner
  public UI; that is a display choice for that page, not a data change).

## Supported dimensions & cross-tabs

`CROSSABLE_DIMENSIONS` (allowlist, `premium-analytics.ts`):
`gender`, `age_group`, `social_category`, `religion`, `top_issue`,
`mla_performance`, `reelection_preference`.

`PREFERENCE_TARGETS` (allowlist): `candidate_choice`, `party_preference`.

The full analytics payload (`getSurveyAnalytics`) computes exactly:
5 standalone distributions unrelated to preference (party, candidate,
gender, age, social category, religion, issues, MLA performance,
re-election — 9 total) plus 5 pre-approved cross-tabs (gender × party, age
× party, social category × party, religion × party, issue × party).

**There is no generic "pick any two dimensions" query endpoint.** The route
accepts a `surveyId` and returns the fixed, pre-approved payload shape —
it does not accept arbitrary dimension parameters from the client, so a
customer cannot construct an unbounded number of tiny, potentially
re-identifying cells (e.g. `Age 18–25 × Religion × Party` is not
representable — cross-tabs are always exactly one dimension × one
preference target).

## Multi-state / multi-election isolation

Every function in this file takes an explicit `surveyId` and, at the API
boundary, `resolveSurveyInScope(surveyId, electionId, constituencyId)`
verifies the survey's actual `electionId`/`constituencyId` match what the
caller claims before any aggregation runs — a request for an unrelated
election/constituency pair is rejected with 400, never silently
re-scoped. There is no function anywhere in this file that aggregates
across multiple surveys, elections, or states.

## API

`GET /api/admin/analytics/[surveyId]` — gated behind the existing admin
session (`getAdminSession()`), the same check every other `/api/admin/*`
route uses. This is **not** a payment-gated endpoint — Phase 16 explicitly
does not implement entitlements. When the paid product is built, its
entitlement check is a separate, additive layer (either in front of this
route, or a new `/api/premium/*` route that calls the same
`getSurveyAnalytics()`); this route itself must never become public.

Response shape:

```ts
{
  survey: { id, title, electionId, constituencyId },
  summary: { totalEligibleResponses, minCellSize },
  partyPreference: Distribution | null,
  candidatePreference: Distribution | null,
  demographics: { gender, ageGroup, socialCategory, religion },
  issues: Distribution | null,
  mlaPerformance: Distribution | null,
  reelection: Distribution | null,
  crossTabs: { genderByParty, ageGroupByParty, socialCategoryByParty, religionByParty, issueByParty },
}
```

Never present anywhere in this payload: raw `SurveyResponse` rows,
`ipHash`, `fingerprint`, `createdAt`/timestamps, respondent IDs, or any
other individually-identifying field. Enforced by a recursive structural
test (`tests/premium-analytics.test.ts`) that fails if any forbidden field
name is ever added to the output, not just against today's exact shape.

## Why raw response export is prohibited

No function in this file, and no route built on top of it, returns
individual `SurveyResponse`/`SurveyAnswer` records. The future Excel export
feature (a later phase) must be generated from this same aggregate layer —
never from a raw-row query — so that suppression is structurally
impossible to bypass by "exporting around it."

## Performance

- Standalone distributions use one `groupBy` query (DB-side counting), not
  a JS loop over every raw answer row.
- Cross-tabs correlate two answer sets in JS (dimension → group, then
  target → tally) — the same technique the pre-existing demographic
  breakdown used, bounded by one survey's response count (not global).
- `getSurveyAnalytics` issues its ~16 aggregation queries in parallel via
  `Promise.all`, not sequentially.
- No external cache is introduced this phase (per the phase's explicit
  instruction); the function boundaries are structured so a caching layer
  could wrap `getSurveyAnalytics`/`getQuestionDistribution`/`getCrossTab`
  later without changing their signatures.

## Future premium customer model (not built yet)

```
Survey → Free Results → Premium Analytics → Purchase → Payment Verification
       → Entitlement → Premium Dashboard → Excel Report
```

This phase implements only "Premium Analytics" as a domain/service layer
plus an admin-only preview route+page. No payment records, orders,
invoices, subscriptions, or hardcoded pricing exist in this codebase.
