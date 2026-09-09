import "server-only";
import { prisma } from "./prisma";

// Keeps the "candidate_choice" survey question's options in sync with a
// constituency's candidate roster whenever candidates are added, edited,
// deactivated or removed via the admin panel / CSV import.
//
// electionId is required scoping: a constituency can have more than one
// survey across different elections, and without it this would pick an
// arbitrary active survey (and pull in candidates from every election) —
// silently corrupting a different election's option list with the wrong
// election's candidates.
export async function syncCandidateChoiceOptions(constituencyId: string, electionId: string) {
  const survey = await prisma.survey.findFirst({ where: { constituencyId, electionId, isActive: true } });
  if (!survey) return;

  const question = await prisma.surveyQuestion.findFirst({
    where: { surveyId: survey.id, key: "candidate_choice" },
    include: { options: true },
  });
  if (!question) return;

  const candidates = await prisma.candidate.findMany({
    where: { constituencyId, electionId, isActive: true },
  });

  const existingByCandidate = new Map(
    question.options.filter((o) => o.candidateRef).map((o) => [o.candidateRef as string, o])
  );

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const existing = existingByCandidate.get(c.id);
    if (existing) {
      await prisma.surveyOption.update({
        where: { id: existing.id },
        data: { key: c.slug, label: c.name, order: i, partyId: c.partyId, isActive: true },
      });
      existingByCandidate.delete(c.id);
    } else {
      await prisma.surveyOption.create({
        data: {
          questionId: question.id,
          key: c.slug,
          label: c.name,
          order: i,
          candidateRef: c.id,
          partyId: c.partyId,
        },
      });
    }
  }

  // Any leftover options reference candidates that were removed/deactivated —
  // deactivate rather than delete, to preserve historical answer integrity.
  for (const stale of existingByCandidate.values()) {
    await prisma.surveyOption.update({ where: { id: stale.id }, data: { isActive: false } });
  }
}
