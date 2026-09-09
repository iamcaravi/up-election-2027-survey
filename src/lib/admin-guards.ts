import "server-only";
import type { PrismaClient } from "@prisma/client";

// Pure validation/dependency-check helpers shared by the admin hierarchy
// API routes (states/elections/districts/constituencies/election-
// constituencies) and their tests. Extracted so these invariants can be
// unit-tested directly against a Prisma client without needing a live
// Next.js request context (the route handlers themselves depend on
// next/headers via getAdminSession(), which only works inside a real
// request).

export interface Blocker {
  error: string;
}

export async function getStateDeletionBlockers(prisma: PrismaClient, stateId: string): Promise<Blocker | null> {
  const [electionCount, districtCount, constituencyCount] = await Promise.all([
    prisma.election.count({ where: { stateId } }),
    prisma.district.count({ where: { stateId } }),
    prisma.constituency.count({ where: { stateId } }),
  ]);
  if (electionCount === 0 && districtCount === 0 && constituencyCount === 0) return null;
  return {
    error:
      `Cannot delete state because it still has ${electionCount} election(s), ${districtCount} district(s) and ` +
      `${constituencyCount} constituency(ies) associated with it. Disable the state instead, or remove those ` +
      `records first.`,
  };
}

export async function getElectionDeletionBlockers(prisma: PrismaClient, electionId: string): Promise<Blocker | null> {
  const [candidateCount, surveyCount, mappingCount] = await Promise.all([
    prisma.candidate.count({ where: { electionId } }),
    prisma.survey.count({ where: { electionId } }),
    prisma.electionConstituency.count({ where: { electionId } }),
  ]);
  if (candidateCount === 0 && surveyCount === 0 && mappingCount === 0) return null;
  return {
    error:
      `Cannot delete election because it still has ${candidateCount} candidate(s), ${surveyCount} survey(s) and ` +
      `${mappingCount} constituency mapping(s). Disable the election instead (isActive: false), or remove those ` +
      `records first to preserve historical data.`,
  };
}

export async function getDistrictDeletionBlockers(prisma: PrismaClient, districtId: string): Promise<Blocker | null> {
  const constituencyCount = await prisma.constituency.count({ where: { districtId } });
  if (constituencyCount === 0) return null;
  return { error: "Cannot delete district because constituencies are still associated with it." };
}

export async function getConstituencyDeletionBlockers(prisma: PrismaClient, constituencyId: string): Promise<Blocker | null> {
  const [candidateCount, surveyCount, responseCount, mappingCount] = await Promise.all([
    prisma.candidate.count({ where: { constituencyId } }),
    prisma.survey.count({ where: { constituencyId } }),
    prisma.surveyResponse.count({ where: { constituencyId } }),
    prisma.electionConstituency.count({ where: { constituencyId } }),
  ]);
  if (candidateCount === 0 && surveyCount === 0 && responseCount === 0 && mappingCount === 0) return null;
  return {
    error:
      `Cannot delete constituency because it still has ${candidateCount} candidate(s), ${surveyCount} survey(s), ` +
      `${responseCount} survey response(s) and ${mappingCount} election mapping(s) associated with it. Remove or ` +
      `archive those first — survey responses in particular must never be silently destroyed.`,
  };
}

export async function getElectionConstituencyRemovalBlockers(
  prisma: PrismaClient,
  electionId: string,
  constituencyId: string
): Promise<Blocker | null> {
  const [candidateCount, surveyCount] = await Promise.all([
    prisma.candidate.count({ where: { electionId, constituencyId } }),
    prisma.survey.count({ where: { electionId, constituencyId } }),
  ]);
  if (candidateCount === 0 && surveyCount === 0) return null;
  return {
    error:
      `Cannot remove this mapping because the constituency still has ${candidateCount} candidate(s) and ` +
      `${surveyCount} survey(s) for this election. Disable the mapping instead (PATCH isActive:false), or ` +
      `remove those records first.`,
  };
}

// Validates that a district belongs to the given state before it is used
// to create/move a constituency — never trust a client-supplied districtId
// to already be correctly scoped.
export async function assertDistrictInState(
  prisma: PrismaClient,
  stateId: string,
  districtId: string
): Promise<Blocker | null> {
  const district = await prisma.district.findUnique({ where: { id: districtId } });
  if (!district) return { error: "District not found." };
  if (district.stateId !== stateId) {
    return { error: `District "${district.name}" does not belong to the selected state.` };
  }
  return null;
}

// Validates that an election and constituency belong to the same state
// before they can be mapped together — the single most important
// ElectionConstituency invariant.
export async function assertElectionConstituencySameState(
  prisma: PrismaClient,
  electionId: string,
  constituencyId: string
): Promise<Blocker | null> {
  const [election, constituency] = await Promise.all([
    prisma.election.findUnique({ where: { id: electionId } }),
    prisma.constituency.findUnique({ where: { id: constituencyId } }),
  ]);
  if (!election) return { error: "Election not found." };
  if (!constituency) return { error: "Constituency not found." };
  if (election.stateId !== constituency.stateId) {
    return { error: "Cannot map a constituency to an election from a different state." };
  }
  return null;
}

// Validates that an (electionId, constituencyId) pair is a genuinely valid
// combination — same state AND an active ElectionConstituency membership —
// before it is used to create a Candidate or Survey. A mismatched pair
// (wrong state, or a constituency not actually contesting that election)
// must never be accepted, regardless of what the client requests.
export async function getSurveyDeletionBlockers(prisma: PrismaClient, surveyId: string): Promise<Blocker | null> {
  const responseCount = await prisma.surveyResponse.count({ where: { surveyId } });
  if (responseCount === 0) return null;
  return {
    error: `Cannot delete survey because it has ${responseCount} response(s). Disable it instead (isActive: false) — survey responses must never be destroyed.`,
  };
}

// Rejects creating/re-activating a survey if another ACTIVE survey already
// exists for the same (election, constituency) pair — a constituency's
// public survey/results pages assume exactly one active survey per election.
// `excludeSurveyId` lets a survey being re-activated ignore itself.
export async function assertNoConflictingActiveSurvey(
  prisma: PrismaClient,
  electionId: string,
  constituencyId: string,
  excludeSurveyId?: string
): Promise<Blocker | null> {
  const clash = await prisma.survey.findFirst({
    where: {
      electionId,
      constituencyId,
      isActive: true,
      ...(excludeSurveyId ? { id: { not: excludeSurveyId } } : {}),
    },
  });
  if (!clash) return null;
  return {
    error: "An active survey already exists for this election and constituency. Disable it first, or edit the existing survey instead.",
  };
}

export async function assertElectionConstituencyMembership(
  prisma: PrismaClient,
  electionId: string,
  constituencyId: string
): Promise<Blocker | null> {
  const stateBlocker = await assertElectionConstituencySameState(prisma, electionId, constituencyId);
  if (stateBlocker) return stateBlocker;

  const membership = await prisma.electionConstituency.findUnique({
    where: { electionId_constituencyId: { electionId, constituencyId } },
  });
  if (!membership || !membership.isActive) {
    return { error: "This constituency is not an active part of the selected election." };
  }
  return null;
}
