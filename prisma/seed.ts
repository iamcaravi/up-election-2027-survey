import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import constituencyData from "./data/constituencies.json";
import {
  DEFAULT_PARTIES,
  DEFAULT_ISSUES,
  AGE_GROUPS,
  GENDERS,
  SOCIAL_CATEGORIES,
  RELIGIONS,
  MIN_ANALYTICS_GROUP_SIZE_DEFAULT,
} from "../src/lib/enums";
import { slugify } from "../src/lib/slugify";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding India Election Survey database...");

  // --- State + Election -------------------------------------------------------
  const upState = await prisma.state.upsert({
    where: { slug: "uttar-pradesh" },
    update: {},
    create: {
      name: "Uttar Pradesh",
      slug: "uttar-pradesh",
      code: "UP",
      shortName: "UP",
      isActive: true,
    },
  });

  const upElection = await prisma.election.upsert({
    where: { stateId_slug: { stateId: upState.id, slug: "assembly-2027" } },
    update: {},
    create: {
      stateId: upState.id,
      name: "Uttar Pradesh Assembly Election 2027",
      slug: "assembly-2027",
      electionType: "ASSEMBLY",
      year: 2027,
      status: "UPCOMING",
      description: "Voluntary public-opinion survey ahead of the 2027 UP Assembly election. Not an official election result.",
      isActive: true,
    },
  });

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

  // --- Parties ---------------------------------------------------------------
  const parties: Record<string, string> = {};
  for (let i = 0; i < DEFAULT_PARTIES.length; i++) {
    const p = DEFAULT_PARTIES[i];
    const party = await prisma.party.upsert({
      where: { shortName: p.shortName },
      update: { name: p.name, colorHex: p.colorHex, displayOrder: i },
      create: { ...p, displayOrder: i },
    });
    parties[p.shortName] = party.id;
  }

  // --- Districts + Constituencies --------------------------------------------
  const rows = constituencyData.constituencies as Array<[number, string, string, string]>;
  const districtSlugs = new Map<string, string>();

  const districtNames = Array.from(new Set(rows.map((r) => r[2]))).sort();
  for (const name of districtNames) {
    const slug = slugify(name);
    const d = await prisma.district.upsert({
      where: { stateId_slug: { stateId: upState.id, slug } },
      update: { name },
      create: { name, slug, stateId: upState.id },
    });
    districtSlugs.set(name, d.id);
  }
  console.log(`Seeded ${districtNames.length} districts`);

  const usedSlugs = new Set<string>();
  let constituencyCount = 0;
  for (const [number, name, districtName, reserved] of rows) {
    const districtId = districtSlugs.get(districtName);
    if (!districtId) throw new Error(`Unknown district ${districtName} for AC#${number}`);
    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${number}`;
    usedSlugs.add(slug);

    const constituency = await prisma.constituency.upsert({
      where: { stateId_number: { stateId: upState.id, number } },
      update: { name, districtId, reservedStatus: reserved, slug },
      create: { number, name, slug, districtId, reservedStatus: reserved, stateId: upState.id },
    });
    constituencyCount++;

    await prisma.electionConstituency.upsert({
      where: { electionId_constituencyId: { electionId: upElection.id, constituencyId: constituency.id } },
      update: {},
      create: { electionId: upElection.id, constituencyId: constituency.id },
    });

    // Seed one statewide-template survey per constituency with the standard
    // question set. Candidate options are added later as candidates are
    // imported (see src/lib/survey-sync.ts).
    const existingSurvey = await prisma.survey.findFirst({ where: { constituencyId: constituency.id, electionId: upElection.id } });
    if (!existingSurvey) {
      const survey = await prisma.survey.create({
        data: {
          electionId: upElection.id,
          constituencyId: constituency.id,
          title: `${name} — 2027 विधानसभा सर्वे`,
          description: "Voluntary public-opinion survey. Not an official election result.",
          type: "CONSTITUENCY",
          isActive: true,
        },
      });

      const candidateQ = await prisma.surveyQuestion.create({
        data: {
          surveyId: survey.id,
          key: "candidate_choice",
          label: "2027 में आप अपने क्षेत्र से किसे विधायक देखना चाहते हैं?",
          required: true,
          allowSkip: false,
          order: 1,
        },
      });
      await prisma.surveyOption.create({
        data: { questionId: candidateQ.id, key: "other", label: "Other", order: 999 },
      });

      const partyQ = await prisma.surveyQuestion.create({
        data: {
          surveyId: survey.id,
          key: "party_preference",
          label: "अगर आज विधानसभा चुनाव हों तो आप किस पार्टी को वोट देना पसंद करेंगे?",
          required: false,
          allowSkip: true,
          order: 2,
        },
      });
      for (let i = 0; i < DEFAULT_PARTIES.length; i++) {
        const p = DEFAULT_PARTIES[i];
        await prisma.surveyOption.create({
          data: {
            questionId: partyQ.id,
            key: p.slug,
            label: p.shortName,
            order: i,
            partyId: parties[p.shortName],
          },
        });
      }

      const issueQ = await prisma.surveyQuestion.create({
        data: {
          surveyId: survey.id,
          key: "top_issue",
          label: "आपके क्षेत्र में सबसे बड़ा मुद्दा क्या है?",
          required: false,
          allowSkip: true,
          order: 3,
        },
      });
      for (let i = 0; i < DEFAULT_ISSUES.length; i++) {
        const issue = DEFAULT_ISSUES[i];
        await prisma.surveyOption.create({
          data: { questionId: issueQ.id, key: issue.key, label: issue.label, order: i },
        });
      }

      const demoQuestions: Array<{ key: string; label: string; options: readonly { key: string; label: string }[] }> = [
        { key: "age_group", label: "आयु वर्ग", options: AGE_GROUPS },
        { key: "gender", label: "लिंग", options: GENDERS },
        { key: "social_category", label: "सामाजिक श्रेणी", options: SOCIAL_CATEGORIES },
        { key: "religion", label: "धर्म", options: RELIGIONS },
      ];
      let order = 4;
      for (const dq of demoQuestions) {
        const q = await prisma.surveyQuestion.create({
          data: { surveyId: survey.id, key: dq.key, label: dq.label, required: false, allowSkip: true, order: order++ },
        });
        for (let i = 0; i < dq.options.length; i++) {
          const opt = dq.options[i];
          await prisma.surveyOption.create({
            data: { questionId: q.id, key: opt.key, label: opt.label, order: i },
          });
        }
        await prisma.surveyOption.create({
          data: { questionId: q.id, key: "prefer_not_to_say", label: "Prefer not to say", order: 999 },
        });
      }
    }
  }
  console.log(`Seeded ${constituencyCount} constituencies with surveys`);

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
