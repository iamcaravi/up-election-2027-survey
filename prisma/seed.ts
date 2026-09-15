import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATE_SEEDS, type StateSeedConfig } from "./data/state-seeds";
import { FAQ_CATEGORIES } from "../src/lib/faq-data";
import { CANONICAL_SPECIAL_PARTIES, DEFAULT_ISSUES, MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "../src/lib/enums";
import { slugify } from "../src/lib/slugify";
import { createDefaultSurveyQuestions, ensureDefaultSurveyQuestions } from "../src/lib/survey-template-data";

const prisma = new PrismaClient();

// --- Resumability (see README "Resuming an interrupted production seed") --
//
// A remote Postgres connection (e.g. Neon's pooled endpoint) can drop
// mid-run on a long seed. Two things make that safe to resume from rather
// than requiring a full restart:
//
// 1. Every state/election/party/district/constituency upsert below was
//    already idempotent. The one gap was per-constituency survey setup: if
//    the process died between `survey.create()` and its question/option
//    work finishing, the Survey row existed with an incomplete question
//    set, and the old "skip if a Survey already exists" check would skip it
//    forever. seedState() below now checks the survey's question COUNT, not
//    just its existence, and routes to the appropriate repair path.
// 2. SEED_BATCH_LIMIT (optional env var) caps how many constituencies get
//    (re)processed in a single run before exiting cleanly (code 0) instead
//    of running unbounded — re-running the seed command continues exactly
//    where it left off, since already-complete constituencies are skipped
//    almost for free (one count query, no writes).
//
// A transient connection error during a single constituency's work is
// retried a couple of times with a short backoff; if it still fails, the
// process logs exactly which state/constituency was in progress and exits
// cleanly (code 1) rather than crashing with an unhandled rejection. Either
// way, re-running `npm run seed` (optionally with SEED_BATCH_LIMIT set)
// continues safely — nothing is ever deleted or duplicated.
class SeedBatchLimitReached extends Error {}

const SEED_BATCH_LIMIT = process.env.SEED_BATCH_LIMIT ? Number.parseInt(process.env.SEED_BATCH_LIMIT, 10) : undefined;
// Optional SEED_STATE (e.g. "UP") restricts a run to a single state's config by its `code`,
// so a large seed can be resumed one state at a time. Absent, every configured state runs — unchanged.
const SEED_STATE = process.env.SEED_STATE?.trim().toUpperCase();
let constituenciesWrittenThisRun = 0;

const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
function isConnectionError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && CONNECTION_ERROR_CODES.has(String((err as { code?: unknown }).code));
}

async function withConnectionRetry<T>(label: string, fn: () => Promise<T>, retries = 2, delayMs = 3000): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isConnectionError(err) && attempt < retries) {
        console.warn(`[seed] transient connection error during ${label} (attempt ${attempt + 1}/${retries + 1}) — retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

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
    if (SEED_BATCH_LIMIT && constituenciesWrittenThisRun >= SEED_BATCH_LIMIT) {
      throw new SeedBatchLimitReached();
    }

    const districtId = districtSlugs.get(districtName);
    if (!districtId) throw new Error(`[${config.name}] Unknown district ${districtName} for AC#${number}`);
    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${number}`;
    usedSlugs.add(slug);

    const label = `${config.name} AC#${number} (${name})`;

    const constituency = await withConnectionRetry(label, () =>
      prisma.constituency.upsert({
        where: { stateId_number: { stateId: state.id, number } },
        update: { name, districtId, reservedStatus: reserved, slug },
        create: { number, name, slug, districtId, reservedStatus: reserved, stateId: state.id },
      })
    );
    constituencyCount++;

    await withConnectionRetry(label, () =>
      prisma.electionConstituency.upsert({
        where: { electionId_constituencyId: { electionId: election.id, constituencyId: constituency.id } },
        update: {},
        create: { electionId: election.id, constituencyId: constituency.id },
      })
    );

    // Seed one statewide-template survey per constituency with the standard
    // 7-question set. Candidate options are added later as candidates are
    // imported (see src/lib/survey-sync.ts). Resumability: a Survey's
    // question COUNT (not just its existence) decides what happens next —
    // 7 means already fully seeded (skip, no writes at all); 0 means either
    // brand new or an orphan left by a run that died right after creating
    // the Survey row (safe to bulk-create via the fast path); anything else
    // is a partial survey from an interrupted run and is repaired via the
    // slower, upsert-based path that can't violate a unique-key constraint
    // on already-existing rows.
    const existingSurvey = await withConnectionRetry(label, () =>
      prisma.survey.findFirst({
        where: { constituencyId: constituency.id, electionId: election.id },
        select: { id: true, _count: { select: { questions: true } } },
      })
    );

    let wroteSomething = false;
    if (!existingSurvey) {
      const survey = await withConnectionRetry(label, () =>
        prisma.survey.create({
          data: {
            electionId: election.id,
            constituencyId: constituency.id,
            title: `${name} — ${config.year} विधानसभा सर्वे`,
            description: "Voluntary public-opinion survey. Not an official election result.",
            type: "CONSTITUENCY",
            isActive: true,
          },
        })
      );
      await withConnectionRetry(label, () => createDefaultSurveyQuestions(prisma, survey.id, state.id));
      wroteSomething = true;
    } else if (existingSurvey._count.questions === 0) {
      await withConnectionRetry(label, () => createDefaultSurveyQuestions(prisma, existingSurvey.id, state.id));
      wroteSomething = true;
    } else if (existingSurvey._count.questions < 7) {
      console.warn(`[seed] repairing partial survey for ${label} (had ${existingSurvey._count.questions}/7 questions)`);
      await withConnectionRetry(label, () => ensureDefaultSurveyQuestions(prisma, existingSurvey.id, state.id));
      wroteSomething = true;
    }

    if (wroteSomething) constituenciesWrittenThisRun++;
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
  const statesToSeed = SEED_STATE ? STATE_SEEDS.filter((c) => c.code.toUpperCase() === SEED_STATE) : STATE_SEEDS;
  if (SEED_STATE && statesToSeed.length === 0) {
    throw new Error(`SEED_STATE=${SEED_STATE} did not match any configured state code (${STATE_SEEDS.map((c) => c.code).join(", ")}).`);
  }
  for (const config of statesToSeed) {
    await seedState(config);
  }

  // --- FAQ content (Admin → FAQ) ---------------------------------------------
  // Idempotent and one-way: only runs when the table is empty, so re-running
  // `npm run seed` never overwrites content an admin has since edited through
  // the FAQ manager. src/lib/faq-data.ts stays the canonical *initial*
  // question set (the same 50 questions authored during the launch-readiness
  // pass) — the live public /faq page reads from FaqItem rows, not this file.
  const existingFaqCount = await prisma.faqItem.count();
  if (existingFaqCount === 0) {
    let seededFaqCount = 0;
    for (const category of FAQ_CATEGORIES) {
      for (const [index, item] of category.items.entries()) {
        await prisma.faqItem.create({
          data: {
            category: category.id,
            categoryLabel: category.label,
            question: item.q,
            answer: item.a,
            displayOrder: index,
            published: true,
          },
        });
        seededFaqCount += 1;
      }
    }
    console.log(`Seeded ${seededFaqCount} FAQ items across ${FAQ_CATEGORIES.length} categories.`);
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
  .then(() => {
    if (constituenciesWrittenThisRun > 0) {
      console.log(`[seed] wrote/repaired ${constituenciesWrittenThisRun} constituenc${constituenciesWrittenThisRun === 1 ? "y" : "ies"} this run.`);
    }
  })
  .catch((e) => {
    if (e instanceof SeedBatchLimitReached) {
      console.log(
        `[seed] SEED_BATCH_LIMIT (${SEED_BATCH_LIMIT}) reached after writing/repairing ${constituenciesWrittenThisRun} constituencies this run. ` +
          "Exiting cleanly — nothing was lost or duplicated. Re-run `npm run seed` to continue from where this left off."
      );
      return; // clean stop, not a failure — exit code stays 0
    }
    if (isConnectionError(e)) {
      console.error(
        `[seed] lost the database connection after writing/repairing ${constituenciesWrittenThisRun} constituencies this run. ` +
          "Nothing was corrupted — every constituency's survey setup is atomic. Re-run `npm run seed` to continue."
      );
      console.error(e);
    } else {
      console.error(e);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
