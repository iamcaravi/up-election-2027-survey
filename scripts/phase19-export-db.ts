import { prisma } from "../src/lib/prisma";
import fs from "fs";

async function main() {
  const consts = await prisma.constituency.findMany({
    select: { id: true, number: true, name: true, slug: true, state: { select: { slug: true } } },
    orderBy: { number: "asc" },
  });
  const parties = await prisma.party.findMany({
    select: { id: true, name: true, shortName: true, slug: true },
  });
  const candidateCount = await prisma.candidate.count();
  console.log("constituencies:", consts.length);
  console.log("parties:", parties.length);
  console.log("candidates:", candidateCount);
  fs.writeFileSync("scripts/.out-constituencies.json", JSON.stringify(consts, null, 1));
  fs.writeFileSync("scripts/.out-parties.json", JSON.stringify(parties, null, 1));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
