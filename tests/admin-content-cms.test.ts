// Admin Content CMS (FAQ + Branding/Social Links) — added alongside the
// Admin Panel content-management upgrade. Runs against an ephemeral Postgres
// schema (never prisma/dev.db). See tests/helpers/testDb.ts. Auth-required
// and role-gating checks are structural (same pattern as survey-admin.test.ts
// and admin-hierarchy.test.ts) because getAdminSession() depends on
// next/headers' cookies(), which only resolves inside a real Next.js request
// — everything else here is a real functional test against Prisma directly.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let schema: string;
let authLib: typeof import("../src/lib/auth");
let faqContentLib: typeof import("../src/lib/faq-content");
let siteBrandingLib: typeof import("../src/lib/site-branding");
let socialLinksLib: typeof import("../src/lib/social-links");

const repoRoot = path.resolve(__dirname, "..");
function readRoute(file: string) {
  return readFileSync(path.join(repoRoot, file), "utf-8");
}

before(async () => {
  const db = setupTestDb("test-admin-content-cms");
  prisma = db.prisma;
  schema = db.schema;
  // Must be set before any dynamic import touching the src/lib/prisma
  // singleton, or it binds to whatever DATABASE_URL this process inherited.
  process.env.DATABASE_URL = db.url;
  authLib = await import("../src/lib/auth");
  faqContentLib = await import("../src/lib/faq-content");
  siteBrandingLib = await import("../src/lib/site-branding");
  socialLinksLib = await import("../src/lib/social-links");
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, schema);
});

// --- Structural: every handler requires a session ---------------------------

test("1. every FAQ admin route handler requires an authenticated session", () => {
  const files = [
    "src/app/api/admin/faq/route.ts",
    "src/app/api/admin/faq/[id]/route.ts",
    "src/app/api/admin/faq/[id]/versions/route.ts",
    "src/app/api/admin/site-branding/route.ts",
  ];
  for (const file of files) {
    const source = readRoute(file);
    const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE|PUT)/g) ?? []).length;
    const authCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
    assert.ok(handlerCount > 0, `${file}: expected at least one exported handler`);
    assert.equal(authCount, handlerCount, `${file}: expected one getAdminSession() call per handler`);
  }
});

test("2. FAQ write handlers (POST/PATCH/DELETE) are role-gated; GET is not", () => {
  const listSource = readRoute("src/app/api/admin/faq/route.ts");
  const itemSource = readRoute("src/app/api/admin/faq/[id]/route.ts");
  const versionsSource = readRoute("src/app/api/admin/faq/[id]/versions/route.ts");

  // hasAdminRole appears exactly once per write handler (POST in list+versions, PATCH+DELETE in item).
  assert.match(listSource, /export async function POST[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(itemSource, /export async function PATCH[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(itemSource, /export async function DELETE[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(versionsSource, /export async function POST[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);

  // GET (list) never calls hasAdminRole — any authenticated admin can read.
  const getBlock = listSource.slice(listSource.indexOf("export async function GET"), listSource.indexOf("export async function POST"));
  assert.doesNotMatch(getBlock, /hasAdminRole/);
});

test("3. site-branding PUT is ADMIN-only (not the shared hasAdminRole allow-list)", () => {
  const source = readRoute("src/app/api/admin/site-branding/route.ts");
  const putBlock = source.slice(source.indexOf("export async function PUT"));
  assert.match(putBlock, /session\.role !== "ADMIN"/);
});

// --- Functional: hasAdminRole -----------------------------------------------

test("4. hasAdminRole allows listed roles and rejects others / no session", () => {
  const admin = { sub: "1", email: "a@x.com", name: "A", role: "ADMIN" as const };
  const moderator = { sub: "2", email: "m@x.com", name: "M", role: "MODERATOR" as const };
  assert.equal(authLib.hasAdminRole(admin, ["ADMIN", "EDITOR"]), true);
  assert.equal(authLib.hasAdminRole(moderator, ["ADMIN", "EDITOR"]), false);
  assert.equal(authLib.hasAdminRole(null, ["ADMIN", "EDITOR"]), false);
});

// --- Functional: FAQ content CRUD + versioning + publish filtering ----------

test("5. published FAQ items appear via loadPublishedFaqCategories; drafts do not", async () => {
  await prisma.faqItem.create({
    data: { category: "general", categoryLabel: "General", question: "Published Q", answer: "A1", displayOrder: 0, published: true },
  });
  await prisma.faqItem.create({
    data: { category: "general", categoryLabel: "General", question: "Draft Q", answer: "A2", displayOrder: 1, published: false },
  });

  const categories = await faqContentLib.loadPublishedFaqCategories(prisma);
  const general = categories.find((c) => c.id === "general");
  assert.ok(general, "expected a general category");
  const questions = general!.items.map((i) => i.q);
  assert.ok(questions.includes("Published Q"));
  assert.ok(!questions.includes("Draft Q"), "unpublished FAQ item leaked into public data");
});

test("6. categories are grouped and ordered by displayOrder within category", async () => {
  await prisma.faqItem.deleteMany();
  await prisma.faqItem.create({
    data: { category: "technical", categoryLabel: "Technical", question: "Second", answer: "a", displayOrder: 1, published: true },
  });
  await prisma.faqItem.create({
    data: { category: "technical", categoryLabel: "Technical", question: "First", answer: "a", displayOrder: 0, published: true },
  });

  const categories = await faqContentLib.loadPublishedFaqCategories(prisma);
  const technical = categories.find((c) => c.id === "technical");
  assert.deepEqual(technical?.items.map((i) => i.q), ["First", "Second"]);
});

test("7. FaqItemVersion snapshot survives deletion of its parent FaqItem", async () => {
  const item = await prisma.faqItem.create({
    data: { category: "general", categoryLabel: "General", question: "To delete", answer: "a", displayOrder: 5, published: true },
  });
  await prisma.faqItemVersion.create({
    data: { faqItemId: item.id, category: item.category, question: item.question, answer: item.answer, createdBy: "test@x.com" },
  });
  await prisma.faqItem.delete({ where: { id: item.id } });

  const versions = await prisma.faqItemVersion.findMany({ where: { faqItemId: item.id } });
  assert.equal(versions.length, 1, "version row should outlive its deleted parent FaqItem");
  assert.equal(versions[0].question, "To delete");
});

// --- Functional: site branding + social links -------------------------------

test("8. getSiteBranding returns defaults when unset, and merges partial stored values", async () => {
  const defaults = await siteBrandingLib.getSiteBranding();
  assert.equal(defaults.siteName, siteBrandingLib.DEFAULT_SITE_BRANDING.siteName);
  assert.equal(defaults.contactEmail, siteBrandingLib.DEFAULT_SITE_BRANDING.contactEmail);

  await prisma.siteSetting.create({
    data: { key: siteBrandingLib.SITE_BRANDING_KEY, value: JSON.stringify({ siteName: "Custom Name" }) },
  });
  const merged = await siteBrandingLib.getSiteBranding();
  assert.equal(merged.siteName, "Custom Name");
  // tagline/contactEmail fall back to defaults since they weren't in the partial stored blob
  assert.equal(merged.contactEmail, siteBrandingLib.DEFAULT_SITE_BRANDING.contactEmail);
});

test("9. normalizeSocialLinksInput drops empty-string values", () => {
  const normalized = siteBrandingLib.normalizeSocialLinksInput({ x: "https://x.com/handle", facebook: "", instagram: undefined });
  assert.deepEqual(normalized, { x: "https://x.com/handle" });
});

test("10. getSocialLinks reflects what an admin write persists (SOCIAL_LINKS SiteSetting key)", async () => {
  const before = await socialLinksLib.getSocialLinks();
  assert.deepEqual(before, {});

  await prisma.siteSetting.upsert({
    where: { key: socialLinksLib.SOCIAL_LINKS_KEY },
    update: { value: JSON.stringify({ x: "https://x.com/votersurvey" }) },
    create: { key: socialLinksLib.SOCIAL_LINKS_KEY, value: JSON.stringify({ x: "https://x.com/votersurvey" }) },
  });
  const after = await socialLinksLib.getSocialLinks();
  assert.equal(after.x, "https://x.com/votersurvey");
});
