import "server-only";

import type { PrismaClient } from "@prisma/client";
import { SURVEY_ELIGIBLE_CANDIDATE_STATUSES } from "./enums";
import { isCandidateEligibleForSurveyParty, isSpecialPartyPreferenceKey } from "./survey-eligibility";

export interface SubmittedSurveyAnswer {
  questionKey: string;
  optionKey?: string;
  valueText?: string;
}

interface SubmissionOption {
  id: string;
  key: string;
  isActive: boolean;
  candidateRef: string | null;
  partyId: string | null;
  party: { id: string; isActive: boolean } | null;
}

interface SubmissionQuestion {
  id: string;
  key: string;
  type: string;
  required: boolean;
  options: SubmissionOption[];
}

export interface SubmissionSurvey {
  id: string;
  electionId: string;
  constituencyId: string | null;
  status: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  questions: SubmissionQuestion[];
}

export type SurveyValidationDb = Pick<PrismaClient, "electionConstituency" | "candidate">;

export interface ResolvedSurveyAnswer {
  questionId: string;
  optionId?: string;
  valueText?: string;
}

export class SurveySubmissionValidationError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "SurveySubmissionValidationError";
  }
}

const SYNTHETIC_OTHER_CANDIDATE_KEY = "other";

export async function validateSurveySubmission(
  db: SurveyValidationDb,
  survey: SubmissionSurvey,
  answers: SubmittedSurveyAnswer[],
  now = new Date()
): Promise<ResolvedSurveyAnswer[]> {
  if (!survey.isActive || survey.status !== "ACTIVE") {
    throw new SurveySubmissionValidationError("Survey is not accepting responses.", 403);
  }
  if (survey.startsAt && now < survey.startsAt) {
    throw new SurveySubmissionValidationError("Survey has not started yet.", 403);
  }
  if (survey.endsAt && now > survey.endsAt) {
    throw new SurveySubmissionValidationError("Survey has closed.", 403);
  }
  if (!survey.constituencyId) {
    throw new SurveySubmissionValidationError("Survey has no constituency context.");
  }

  const membership = await db.electionConstituency.findUnique({
    where: {
      electionId_constituencyId: {
        electionId: survey.electionId,
        constituencyId: survey.constituencyId,
      },
    },
    select: { isActive: true },
  });
  if (!membership?.isActive) {
    throw new SurveySubmissionValidationError("Survey constituency is not active for this election.");
  }

  const questionsByKey = new Map(survey.questions.map((question) => [question.key, question]));
  const seenKeys = new Set<string>();
  for (const answer of answers) {
    if (!questionsByKey.has(answer.questionKey)) {
      throw new SurveySubmissionValidationError(`Unknown question: ${answer.questionKey}`);
    }
    if (seenKeys.has(answer.questionKey)) {
      throw new SurveySubmissionValidationError(`Duplicate answer: ${answer.questionKey}`);
    }
    seenKeys.add(answer.questionKey);
  }

  const resolved: ResolvedSurveyAnswer[] = [];
  const resolvedOptions = new Map<string, SubmissionOption>();
  for (const answer of answers) {
    const question = questionsByKey.get(answer.questionKey)!;
    if (question.type === "SINGLE_CHOICE") {
      if (!answer.optionKey || answer.valueText !== undefined) {
        throw new SurveySubmissionValidationError(`Choice question ${question.key} requires an option.`);
      }
      const option = question.options.find((candidate) => candidate.key === answer.optionKey && candidate.isActive);
      if (!option) {
        throw new SurveySubmissionValidationError(`Invalid option for ${question.key}`);
      }
      resolved.push({ questionId: question.id, optionId: option.id });
      resolvedOptions.set(question.key, option);
    } else if (question.type === "TEXT") {
      if (answer.optionKey !== undefined || !answer.valueText?.trim()) {
        throw new SurveySubmissionValidationError(`Text question ${question.key} requires text.`);
      }
      resolved.push({ questionId: question.id, valueText: answer.valueText.trim().slice(0, 500) });
    } else {
      throw new SurveySubmissionValidationError(`Unsupported question type: ${question.type}`);
    }
  }

  for (const question of survey.questions) {
    if (question.required && !seenKeys.has(question.key)) {
      throw new SurveySubmissionValidationError(`Missing required answer: ${question.key}`);
    }
  }

  const partyQuestion = questionsByKey.get("party_preference");
  const selectedPartyOption = resolvedOptions.get("party_preference");
  if (!partyQuestion || !selectedPartyOption) {
    throw new SurveySubmissionValidationError("Exactly one party preference is required.");
  }

  const isSpecialParty = isSpecialPartyPreferenceKey(selectedPartyOption.key);
  if (selectedPartyOption.partyId) {
    if (!selectedPartyOption.party || selectedPartyOption.party.id !== selectedPartyOption.partyId || !selectedPartyOption.party.isActive) {
      throw new SurveySubmissionValidationError("Selected party is not active.");
    }
  } else if (!isSpecialParty) {
    throw new SurveySubmissionValidationError("Selected party option is not linked to a party.");
  }

  const selectedCandidateOption = resolvedOptions.get("candidate_choice");
  if (isSpecialParty) {
    if (selectedCandidateOption) {
      throw new SurveySubmissionValidationError("Candidate preference is not allowed for this party option.");
    }
    return resolved;
  }

  const selectedPartyId = selectedPartyOption.partyId!;
  const eligibleCandidates = (
    await db.candidate.findMany({
      where: {
        electionId: survey.electionId,
        constituencyId: survey.constituencyId,
        partyId: selectedPartyId,
        isActive: true,
        status: { in: [...SURVEY_ELIGIBLE_CANDIDATE_STATUSES] },
      },
      select: { electionId: true, constituencyId: true, partyId: true, status: true, isActive: true },
    })
  ).filter((candidate) =>
    isCandidateEligibleForSurveyParty(survey.electionId, survey.constituencyId!, selectedPartyId, candidate)
  );

  if (eligibleCandidates.length === 0) {
    if (selectedCandidateOption) {
      throw new SurveySubmissionValidationError("No candidate preference is available for the selected party.");
    }
    return resolved;
  }

  if (!selectedCandidateOption) {
    throw new SurveySubmissionValidationError("Candidate preference is required for the selected party.");
  }

  const isSyntheticOther =
    selectedCandidateOption.key === SYNTHETIC_OTHER_CANDIDATE_KEY &&
    selectedCandidateOption.candidateRef === null &&
    selectedCandidateOption.partyId === null;
  if (isSyntheticOther) return resolved;
  if (!selectedCandidateOption.candidateRef) {
    throw new SurveySubmissionValidationError("Candidate option is not linked to a candidate.");
  }

  const candidate = await db.candidate.findUnique({
    where: { id: selectedCandidateOption.candidateRef },
    select: { electionId: true, constituencyId: true, partyId: true, status: true, isActive: true },
  });
  if (
    !candidate ||
    selectedCandidateOption.partyId !== selectedPartyId ||
    !isCandidateEligibleForSurveyParty(survey.electionId, survey.constituencyId, selectedPartyId, candidate)
  ) {
    throw new SurveySubmissionValidationError("Candidate is not eligible for the selected party and survey.");
  }

  return resolved;
}
