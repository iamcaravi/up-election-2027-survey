import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATE_SEEDS, type StateSeedConfig } from "./data/state-seeds";
import { CANONICAL_SPECIAL_PARTIES, DEFAULT_ISSUES, MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "../src/lib/enums";
import { slugify } from "../src/lib/slugify";
import { createDefaultSurveyQuestions } from "../src/lib/survey-template-data";

const prisma = new PrismaClient();

async function seedState(config: StateSeedConfig) {
  const state = await prisma.state.upsert({
    where: { slug: config.slug },
    update: {},
    create: {
      name: config.name,
      slug: config.slug,
      code: config.code,
      shortName: config.shortName,
      isActive: true,
    },
  });

  const election = await prisma.election.upsert({
    where: { stateId_slug: { stateId: state.id, slug: config.electionSlug } },
    update: {},
    create: {
      stateId: state.id,
      name: config.electionName,
      slug: config.electionSlug,
      electionType: "ASSEMBLY",
      year: config.year,
      status: "UPCOMING",
      description: config.electionDescription,
      isActive: true,
    },
  });

  // --- Parties + this state's featured list -----------------------------
  // A national party (BJP/INC/AAP/BSP) may already exist from an earlier
  // state in this loop — upsert by slug so it's reused, not duplicated.
  for (let i = 0; i < config.parties.length; i++) {
    const p = config.parties[i];
    const party = await prisma.party.upsert({
      where: { slug: p.slug },
      update: { nameEnglish: p.nameEnglish, nameHindi: p.nameHindi, colorHex: p.colorHex, logoUrl: p.logoUrl },
      create: { slug: p.slug, nameEnglish: p.nameEnglish, nameHindi: p.nameHindi, shortName: p.shortName, colorHex: p.colorHex, logoUrl: p.logoUrl, displayOrder: i },
    });
    await prisma.stateParty.upsert({
      where: { stateId_partyId: { stateId: state.id, partyId: party.id } },
      update: { isFeatured: true, displayOrder: i },
      create: { stateId: state.id, partyId: party.id, isFeatured: true, displayOrder: i },
    });
  }

  // --- Districts + Constituencies -----------------------------------------
  const rows = config.constituencyFile.constituencies;
  const districtSlugs = new Map<string, string>();

  const districtNames = Array.from(new Set(rows.map((r) => r[2]))).sort();
  for (const name of districtNames) {
    const slug = slugify(name);
    const d = await prisma.district.upsert({
      where: { stateId_slug: { stateId: state.id, slug } },
      update: { name },
      create: { name, slug, stateId: state.id },
    });
    districtSlugs.set(name, d.id);
  }

  const usedSlugs = new Set<string>();
  let constituencyCount = 0;
  for (const [number, name, districtName, reserved] of rows) {
    const districtId = districtSlugs.get(districtName);
    if (!districtId) throw new Error(`[${config.name}] Unknown district ${districtName} for AC#${number}`);
    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${number}`;
    usedSlugs.add(slug);

    const constituency = await prisma.constituency.upsert({
      where: { stateId_number: { stateId: state.id, number } },
      update: { name, districtId, reservedStatus: reserved, slug },
      create: { number, name, slug, districtId, reservedStatus: reserved, stateId: state.id },
    });
    constituencyCount++;

    await prisma.electionConstituency.upsert({
      where: { electionId_constituencyId: { electionId: election.id, constituencyId: constituency.id } },
      update: {},
      create: { electionId: election.id, constituencyId: constituency.id },
    });

    // Seed one statewide-template survey per constituency with the standard
    // question set. Candidate options are added later as candidates are
    // imported (see src/lib/survey-sync.ts).
    const existingSurvey = await prisma.survey.findFirst({ where: { constituencyId: constituency.id, electionId: election.id } });
    if (!existingSurvey) {
      const survey = await prisma.survey.create({
        data: {
          electionId: election.id,
          constituencyId: constituency.id,
          title: `${name} — ${config.year} विधानसभा सर्वे`,
          description: "Voluntary public-opinion survey. Not an official election result.",
          type: "CONSTITUENCY",
          isActive: true,
        },
      });

      await createDefaultSurveyQuestions(prisma, survey.id, state.id);
    }
  }
  console.log(`Seeded ${config.name}: ${districtNames.length} districts, ${constituencyCount} constituencies, ${config.parties.length} featured parties`);
}

async function main() {
  console.log("Seeding India Election Survey database...");

  // --- Canonical global parties (Other/NOTA/Undecided) --------------------
  // Every state's survey gets these automatically — see
  // getStatePartiesForSurvey in src/lib/survey-template-data.ts.
  for (let i = 0; i < CANONICAL_SPECIAL_PARTIES.length; i++) {
    const p = CANONICAL_SPECIAL_PARTIES[i];
    await prisma.party.upsert({
      where: { slug: p.slug },
      update: { nameEnglish: p.nameEnglish, nameHindi: p.nameHindi, colorHex: p.colorHex },
      create: { slug: p.slug, nameEnglish: p.nameEnglish, nameHindi: p.nameHindi, shortName: p.shortName, colorHex: p.colorHex, displayOrder: 900 + i },
    });
  }

  // --- Site settings -------------------------------------------------------
  await prisma.siteSetting.upsert({
    where: { key: "MIN_ANALYTICS_GROUP_SIZE" },
    update: {},
    create: { key: "MIN_ANALYTICS_GROUP_SIZE", value: JSON.stringify(MIN_ANALYTICS_GROUP_SIZE_DEFAULT) },
  });
  await prisma.siteSetting.upsert({
    where: { key: "ELECTION_PERIOD_MODE" },
    update: {},
    create: {
      key: "ELECTION_PERIOD_MODE",
      value: JSON.stringify({ restricted: false, note: "Normal publication mode. Set restricted:true during the statutory silence period ahead of polling, per Election Commission guidance." }),
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "ISSUES_LIST" },
    update: {},
    create: { key: "ISSUES_LIST", value: JSON.stringify(DEFAULT_ISSUES) },
  });

  // --- States ---------------------------------------------------------------
  for (const config of STATE_SEEDS) {
    await seedState(config);
  }

  // --- Default admin account ------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding the admin account.");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Platform Admin", role: "ADMIN" },
  });
  console.log(`Seeded admin account: ${adminEmail}`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
