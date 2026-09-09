import { prisma } from "../src/lib/prisma";
async function main() {
  const elections = await prisma.election.findMany({ select: { slug: true, name: true, year: true, state: { select: { slug: true } } } });
  console.log(JSON.stringify(elections, null, 1));
}
main().finally(() => prisma.$disconnect());
