import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getSurveyAnalytics, resolveSurveyInScope, type SurveyScope } from "@/lib/premium-analytics";

// This is the analytics ENGINE's access point for the (not-yet-built)
// premium product. It is deliberately gated behind the existing admin
// session — the same authentication every other /api/admin/* route uses —
// rather than inventing a payment/entitlement check here. When the paid
// product is built, its entitlement check is a separate, additive layer in
// front of this route (or a dedicated /api/premium/* route reusing the same
// getSurveyAnalytics() call); this route itself never becomes public.
//
// Never returns raw SurveyResponse rows — see getSurveyAnalytics and the
// structural test in tests/premium-analytics.test.ts that enforces this.
export async function GET(req: NextRequest, { params }: { params: Promise<{ surveyId: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { surveyId } = await params;
  const electionId = req.nextUrl.searchParams.get("electionId");
  const constituencyId = req.nextUrl.searchParams.get("constituencyId");

  let scope: SurveyScope | null;
  if (electionId && constituencyId) {
    // Caller asserted a specific (election, constituency) scope — verify
    // the survey actually belongs to exactly that pair before proceeding.
    // A request naming an unrelated election/constituency for this
    // surveyId is rejected rather than silently ignored.
    scope = await resolveSurveyInScope(surveyId, electionId, constituencyId);
    if (!scope) {
      return NextResponse.json({ error: "Survey does not belong to the specified election/constituency." }, { status: 400 });
    }
  } else {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { id: true, title: true, electionId: true, constituencyId: true },
    });
    if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });
    scope = survey;
  }

  const analytics = await getSurveyAnalytics(scope);
  return NextResponse.json(analytics);
}
