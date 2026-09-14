// Deletes ONLY synthetic demo survey responses (dataSource === "synthetic_demo")
// DB-wide, plus their answers. Every query is filtered by that marker — real
// responses (dataSource === "real") are never selected, never touched.
//
// Run: npm run clear:analysis-demo

import { prisma } from "../src/lib/prisma";

const SYNTHETIC_DATA_SOURCE = "synthetic_demo";
const REAL_DATA_SOURCE = "real";
const CHUNK = 1000;

async function main() {
  const realBefore = await prisma.surveyResponse.count({ where: { dataSource: REAL_DATA_SOURCE } });
  const syntheticBefore = await prisma.surveyResponse.count({ where: { dataSource: SYNTHETIC_DATA_SOURCE } });
  console.log(`REAL RESPONSES BEFORE: ${realBefore}`);
  console.log(`SYNTHETIC RESPONSES BEFORE: ${syntheticBefore}`);

  let deleted = 0;
  while (true) {
    const batch = await prisma.surveyResponse.findMany({
      where: { dataSource: SYNTHETIC_DATA_SOURCE },
      select: { id: true },
      take: CHUNK,
    });
    if (batch.length === 0) break;
    const ids = batch.map((r) => r.id);
    await prisma.surveyAnswer.deleteMany({ where: { responseId: { in: ids } } });
    await prisma.surveyResponse.deleteMany({ where: { id: { in: ids } } });
    deleted += batch.length;
  }

  const realAfter = await prisma.surveyResponse.count({ where: { dataSource: REAL_DATA_SOURCE } });
  const syntheticAfter = await prisma.surveyResponse.count({ where: { dataSource: SYNTHETIC_DATA_SOURCE } });

  console.log(`\nDELETED: ${deleted} synthetic responses (+ their answers)`);
  console.log(`REAL RESPONSES AFTER: ${realAfter}`);
  console.log(`SYNTHETIC RESPONSES AFTER: ${syntheticAfter}`);
  console.log(`\nREAL RESPONSES UNCHANGED: ${realBefore === realAfter ? "YES" : "NO — INVESTIGATE IMMEDIATELY"}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
