import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saltedHash, getClientIp } from "@/lib/hash";
import { isRateLimited } from "@/lib/rate-limit";
import {
  SurveySubmissionValidationError,
  validateSurveySubmission,
} from "@/lib/survey-response-validation";

const answerSchema = z.object({
  questionKey: z.string().min(1),
  optionKey: z.string().min(1).optional(),
  valueText: z.string().max(500).optional(),
});

const bodySchema = z.object({
  answers: z.array(answerSchema).min(1).max(20),
  fingerprint: z.string().min(8).max(200),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: { include: { options: { include: { party: { select: { id: true, isActive: true } } } } } } },
  });
  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  const { answers, fingerprint } = parsed.data;

  const ip = getClientIp(req.headers);
  const ipHash = saltedHash(ip);
  const fingerprintHash = saltedHash(fingerprint);

  // --- Anti-abuse: rate limiting -------------------------------------------------
  if (isRateLimited(`ip:${ipHash}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  if (isRateLimited(`fp:${fingerprintHash}`, 5, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let resolvedAnswers;
  try {
    resolvedAnswers = await validateSurveySubmission(prisma, survey, answers);
  } catch (error) {
    if (error instanceof SurveySubmissionValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    throw error;
  }

  // --- Duplicate detection: one response per fingerprint per survey per 24h ------
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDuplicate = await prisma.surveyResponse.findFirst({
    where: { surveyId, fingerprint: fingerprintHash, createdAt: { gte: since } },
  });

  // --- Burst detection: same IP / device submitting high volume quickly ----------
  // Indian mobile carriers (Jio, Airtel) route large populations through shared
  // CGNAT public IPs. To avoid false-positive flagging of distinct mobile users on
  // the same cell tower while preserving automated burst protection, we evaluate:
  // 1. Same IP + same device fingerprint submitting repeatedly (>5 in 10m) -> FLAGGED
  // 2. Heavy automated network flood (>60 responses from single IP in 10m) -> FLAGGED
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const [recentFromIp, recentFromIpAndDevice] = await Promise.all([
    prisma.surveyResponse.count({
      where: { ipHash, createdAt: { gte: tenMinutesAgo } },
    }),
    prisma.surveyResponse.count({
      where: { ipHash, fingerprint: fingerprintHash, createdAt: { gte: tenMinutesAgo } },
    }),
  ]);

  let status: "VALID" | "FLAGGED" | "REJECTED" = "VALID";
  let flagReason: string | null = null;
  if (recentDuplicate) {
    status = "REJECTED";
    flagReason = "Duplicate submission from the same device within 24 hours.";
  } else if (recentFromIpAndDevice > 5) {
    status = "FLAGGED";
    flagReason = "Unusually high submission volume from this device in a short window.";
  } else if (recentFromIp > 60) {
    status = "FLAGGED";
    flagReason = "Unusually high submission volume from this network in a short window.";
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.surveyResponse.create({
      data: {
        surveyId,
        constituencyId: survey.constituencyId!,
        status,
        ipHash,
        fingerprint: fingerprintHash,
        flagReason: flagReason ?? undefined,
        answers: { create: resolvedAnswers },
      },
    });

    if (status !== "VALID") {
      await tx.moderationFlag.create({
        data: {
          responseId: created.id,
          reason: flagReason ?? "Flagged by automated checks.",
          severity: status === "REJECTED" ? "HIGH" : "MEDIUM",
        },
      });
    }
    return created;
  });

  return NextResponse.json({
    ok: status === "VALID",
    status,
    message:
      status === "VALID"
        ? "Response recorded."
        : status === "REJECTED"
          ? "This response could not be counted (duplicate detected)."
          : "Response recorded but flagged for review.",
  });
}
