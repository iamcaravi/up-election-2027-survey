import { prisma } from "../src/lib/prisma";

async function main() {
  const states = await prisma.state.findMany();
  console.log(JSON.stringify(states, null, 1));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
