import "server-only";

// The actual template data/logic lives in ./survey-template-data, which has
// no "server-only" guard so prisma/seed.ts (run via plain tsx, outside the
// Next.js server bundle) can import it directly. This file re-exports the
// same thing behind the guard so existing application/server code (e.g. the
// admin surveys API route) keeps exactly the same accidental-client-import
// protection it always had.
export { createDefaultSurveyQuestions } from "./survey-template-data";
