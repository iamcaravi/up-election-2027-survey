import { prisma } from "../src/lib/prisma";

async function main() {
  const [states, elections, districts, constituencies, surveys, candidates, verifiedCandidates, incumbentCandidates, surveyOptions] =
    await Promise.all([
      prisma.state.count(),
      prisma.election.count(),
      prisma.district.count(),
      prisma.constituency.count(),
      prisma.survey.count(),
      prisma.candidate.count(),
      prisma.candidate.count({ where: { verified: true } }),
      prisma.candidate.count({ where: { status: "INCUMBENT" } }),
      prisma.surveyOption.count(),
    ]);

  const incumbentIds = new Set((await prisma.candidate.findMany({ where: { status: "INCUMBENT" }, select: { id: true } })).map((c) => c.id));
  const allOptionRefs = (await prisma.surveyOption.findMany({ select: { candidateRef: true } })).map((o) => o.candidateRef).filter(Boolean) as string[];
  const incumbentSurveyOptions = allOptionRefs.filter((ref) => incumbentIds.has(ref)).length;

  console.log(JSON.stringify({
    states, elections, districts, constituencies, surveys,
    candidates, verifiedCandidates, incumbentCandidates,
    surveyOptions, incumbentSurveyOptions,
  }, null, 2));

  const partyBreakdown = await prisma.candidate.groupBy({
    by: ["partyId"],
    _count: true,
  });
  const parties = await prisma.party.findMany();
  const partyMap = new Map(parties.map((p) => [p.id, p.shortName]));
  console.log("Party breakdown:");
  partyBreakdown.forEach((p) => console.log(" ", p.partyId ? partyMap.get(p.partyId) : "Independent", ":", p._count));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
