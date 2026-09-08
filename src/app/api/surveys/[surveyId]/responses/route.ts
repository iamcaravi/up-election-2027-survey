import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saltedHash, getClientIp } from "@/lib/hash";
import { isRateLimited } from "@/lib/rate-limit";

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
    include: { questions: { include: { options: true } } },
  });
  if (!survey || !survey.isActive) {
    return NextResponse.json({ error: "Survey not found or inactive." }, { status: 404 });
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

  // --- Validate question/option references ---------------------------------------
  const questionsByKey = new Map(survey.questions.map((q) => [q.key, q]));
  for (const q of survey.questions) {
    if (q.required && !answers.some((a) => a.questionKey === q.key)) {
      return NextResponse.json({ error: `Missing required answer: ${q.key}` }, { status: 400 });
    }
  }

  const resolvedAnswers: { questionId: string; optionId?: string; valueText?: string }[] = [];
  for (const a of answers) {
    const question = questionsByKey.get(a.questionKey);
    if (!question) continue; // ignore unknown keys rather than failing the whole submission
    if (a.optionKey) {
      const option = question.options.find((o) => o.key === a.optionKey && o.isActive);
      if (!option) {
        return NextResponse.json({ error: `Invalid option for ${a.questionKey}` }, { status: 400 });
      }
      resolvedAnswers.push({ questionId: question.id, optionId: option.id });
    } else if (a.valueText) {
      resolvedAnswers.push({ questionId: question.id, valueText: a.valueText.slice(0, 500) });
    }
  }
  if (resolvedAnswers.length === 0) {
    return NextResponse.json({ error: "No valid answers." }, { status: 400 });
  }

  // --- Duplicate detection: one response per fingerprint per survey per 24h ------
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDuplicate = await prisma.surveyResponse.findFirst({
    where: { surveyId, fingerprint: fingerprintHash, createdAt: { gte: since } },
  });

  // --- Burst detection: same IP submitting to many different surveys quickly -----
  const recentFromIp = await prisma.surveyResponse.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  });

  let status: "VALID" | "FLAGGED" | "REJECTED" = "VALID";
  let flagReason: string | null = null;
  if (recentDuplicate) {
    status = "REJECTED";
    flagReason = "Duplicate submission from the same device within 24 hours.";
  } else if (recentFromIp > 15) {
    status = "FLAGGED";
    flagReason = "Unusually high submission volume from this network in a short window.";
  }

  const response = await prisma.surveyResponse.create({
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
    await prisma.moderationFlag.create({
      data: {
        responseId: response.id,
        reason: flagReason ?? "Flagged by automated checks.",
        severity: status === "REJECTED" ? "HIGH" : "MEDIUM",
      },
    });
  }

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
