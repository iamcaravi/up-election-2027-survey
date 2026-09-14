// Admin Website Control (Phase 2a ContentBlock + 2d Media Library + 2g SEO
// Overrides) — added on top of the frozen launch-audit baseline (9934f09,
// b292bdd). Runs against an ephemeral SQLite database (never prisma/dev.db).
// See tests/helpers/testDb.ts. Auth-required/role-gating checks are
// structural (same pattern as survey-admin.test.ts, admin-hierarchy.test.ts,
// admin-content-cms.test.ts) since getAdminSession() depends on
// next/headers' cookies(), which only resolves inside a real Next.js
// request — everything else is a real functional test against Prisma/lib
// functions directly.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let contentBlocksLib: typeof import("../src/lib/content-blocks");
let mediaLib: typeof import("../src/lib/media");
let seoOverridesLib: typeof import("../src/lib/seo-overrides");
let seoCatalogLib: typeof import("../src/lib/seo-catalog");

const repoRoot = path.resolve(__dirname, "..");
function readRoute(file: string) {
  return readFileSync(path.join(repoRoot, file), "utf-8");
}

before(async () => {
  const db = setupTestDb("test-admin-website-control");
  prisma = db.prisma;
  dbPath = db.dbPath;
  process.env.DATABASE_URL = `file:${dbPath}`;
  contentBlocksLib = await import("../src/lib/content-blocks");
  mediaLib = await import("../src/lib/media");
  seoOverridesLib = await import("../src/lib/seo-overrides");
  seoCatalogLib = await import("../src/lib/seo-catalog");
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

// ============================================================ STRUCTURAL ===

test("1. every Content Block / Media / SEO admin route requires an authenticated session", () => {
  const files = [
    "src/app/api/admin/content-blocks/route.ts",
    "src/app/api/admin/content-blocks/[slotKey]/route.ts",
    "src/app/api/admin/content-blocks/[slotKey]/versions/route.ts",
    "src/app/api/admin/media/route.ts",
    "src/app/api/admin/media/[id]/route.ts",
    "src/app/api/admin/seo/route.ts",
    "src/app/api/admin/seo/catalog/route.ts",
    "src/app/api/admin/seo/resolve/route.ts",
  ];
  for (const file of files) {
    const source = readRoute(file);
    const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE|PUT)/g) ?? []).length;
    const authCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
    assert.ok(handlerCount > 0, `${file}: expected at least one exported handler`);
    assert.equal(authCount, handlerCount, `${file}: expected one getAdminSession() call per handler`);
  }
});

test("2. write handlers are role-gated (hasAdminRole or ADMIN-only where appropriate); read handlers are not", () => {
  const cbList = readRoute("src/app/api/admin/content-blocks/route.ts");
  const cbItem = readRoute("src/app/api/admin/content-blocks/[slotKey]/route.ts");
  const cbVersions = readRoute("src/app/api/admin/content-blocks/[slotKey]/versions/route.ts");
  const mediaList = readRoute("src/app/api/admin/media/route.ts");
  const mediaItem = readRoute("src/app/api/admin/media/[id]/route.ts");
  const seo = readRoute("src/app/api/admin/seo/route.ts");

  assert.match(cbList, /export async function POST[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(cbItem, /export async function PATCH[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(cbVersions, /export async function POST[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(mediaList, /export async function POST[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(mediaItem, /export async function PATCH[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(mediaItem, /export async function DELETE[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(seo, /export async function PUT[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);
  assert.match(seo, /export async function DELETE[\s\S]*?hasAdminRole\(session, WRITE_ROLES\)/);

  const cbGetBlock = cbList.slice(cbList.indexOf("export async function GET"), cbList.indexOf("export async function POST"));
  assert.doesNotMatch(cbGetBlock, /hasAdminRole/, "content-blocks GET should be readable by any authenticated admin");
  const seoGetBlock = seo.slice(seo.indexOf("export async function GET"), seo.indexOf("export async function PUT"));
  assert.doesNotMatch(seoGetBlock, /hasAdminRole/, "SEO GET should be readable by any authenticated admin");
});

// =========================================================== CONTENT BLOCK =

test("3. draft save does not write a version, and does not change publishedValue", async () => {
  await contentBlocksLib.createContentBlock({ slotKey: "test.block1", contentType: "plainText", initialValue: "Original", editorEmail: "a@x.com" });
  await contentBlocksLib.saveContentBlockDraft({ slotKey: "test.block1", value: "Draft edit", editorEmail: "a@x.com" });

  const block = await contentBlocksLib.getContentBlock("test.block1");
  assert.equal(block?.publishedValue, "Original", "publishedValue must not change on draft save");
  assert.equal(block?.draftValue, "Draft edit");
  assert.equal(block?.status, "HAS_DRAFT");

  const versions = await contentBlocksLib.getContentBlockVersions("test.block1");
  assert.equal(versions.length, 0, "draft save must not create a version");
});

test("4. publish snapshots the PRE-publish publishedValue, then copies draft over it and clears draft", async () => {
  const block = await contentBlocksLib.publishContentBlock({ slotKey: "test.block1", editorEmail: "a@x.com" });
  assert.equal(block.publishedValue, "Draft edit");
  assert.equal(block.draftValue, null);
  assert.equal(block.status, "PUBLISHED");
  assert.ok(block.publishedAt);

  const versions = await contentBlocksLib.getContentBlockVersions("test.block1");
  assert.equal(versions.length, 1, "publish must create exactly one version snapshot");
  assert.equal(versions[0].value, "Original", "the version must hold the value that was live BEFORE this publish");
});

test("5. publishing with no pending draft throws (nothing to publish)", async () => {
  await assert.rejects(() => contentBlocksLib.publishContentBlock({ slotKey: "test.block1", editorEmail: "a@x.com" }));
});

test("6. discardContentBlockDraft clears draftValue without touching publishedValue or creating a version", async () => {
  await contentBlocksLib.saveContentBlockDraft({ slotKey: "test.block1", value: "Abandoned edit", editorEmail: "a@x.com" });
  await contentBlocksLib.discardContentBlockDraft({ slotKey: "test.block1", editorEmail: "a@x.com" });

  const block = await contentBlocksLib.getContentBlock("test.block1");
  assert.equal(block?.draftValue, null);
  assert.equal(block?.publishedValue, "Draft edit", "publishedValue from test 4 must be unaffected by discard");

  const versions = await contentBlocksLib.getContentBlockVersions("test.block1");
  assert.equal(versions.length, 1, "discard must not add a new version");
});

test("7. restoreContentBlockVersion writes ONLY draftValue — publishedValue stays live/unchanged until an explicit publish", async () => {
  const versions = await contentBlocksLib.getContentBlockVersions("test.block1");
  const oldVersion = versions[0]; // holds "Original"

  const beforeRestore = await contentBlocksLib.getContentBlock("test.block1");
  const restored = await contentBlocksLib.restoreContentBlockVersion({ slotKey: "test.block1", versionId: oldVersion.id, editorEmail: "a@x.com" });

  assert.equal(restored.draftValue, "Original", "restore must load the historical value into draftValue");
  assert.equal(restored.status, "HAS_DRAFT");
  assert.equal(restored.publishedValue, beforeRestore?.publishedValue, "restore must NOT touch publishedValue directly");

  // Explicit publish is required to make the restored version live.
  const published = await contentBlocksLib.publishContentBlock({ slotKey: "test.block1", editorEmail: "a@x.com" });
  assert.equal(published.publishedValue, "Original");
});

test("8. listContentBlocks returns created blocks ordered by slotKey", async () => {
  await contentBlocksLib.createContentBlock({ slotKey: "test.block2", contentType: "plainText", initialValue: "B", editorEmail: "a@x.com" });
  const all = await contentBlocksLib.listContentBlocks();
  const keys = all.map((b) => b.slotKey);
  assert.ok(keys.includes("test.block1") && keys.includes("test.block2"));
});

// =================================================================== MEDIA =

test("9. media validation rejects oversized files, wrong types, and content/type mismatches", () => {
  const tinyPngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const fakePngFile = { type: "image/png", size: tinyPngBytes.length } as File;
  assert.equal(mediaLib.validateUploadedFile(fakePngFile, tinyPngBytes), null, "a real PNG signature with image/png type should pass");

  const wrongTypeFile = { type: "application/x-msdownload", size: 100 } as File;
  const err1 = mediaLib.validateUploadedFile(wrongTypeFile, Buffer.from([1, 2, 3]));
  assert.ok(err1?.error.includes("Unsupported file type"));

  const tooLargeFile = { type: "image/png", size: mediaLib.MEDIA_MAX_BYTES + 1 } as File;
  const err2 = mediaLib.validateUploadedFile(tooLargeFile, tinyPngBytes);
  assert.ok(err2?.error.includes("too large"));

  const spoofedFile = { type: "image/png", size: 10 } as File;
  const notActuallyPng = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const err3 = mediaLib.validateUploadedFile(spoofedFile, notActuallyPng);
  assert.ok(err3?.error.includes("does not match"));
});

test("10. generateMediaFileName never derives from user input (no path-traversal surface)", () => {
  const name = mediaLib.generateMediaFileName("png");
  assert.match(name, /^media-\d+-[a-f0-9]{8}\.png$/);
  assert.ok(!name.includes(".."), "generated filename must never contain a path-traversal sequence");
  assert.ok(!name.includes("/") && !name.includes("\\"));
});

test("11. MediaAsset CRUD: create, update metadata, delete", async () => {
  const asset = await prisma.mediaAsset.create({
    data: { url: "/uploads/media/test.png", fileName: "test.png", mimeType: "image/png", sizeBytes: 1234, uploadedBy: "a@x.com" },
  });
  assert.equal(asset.altText, null);

  const updated = await prisma.mediaAsset.update({ where: { id: asset.id }, data: { altText: "A test image", caption: "Caption" } });
  assert.equal(updated.altText, "A test image");
  assert.equal(updated.caption, "Caption");

  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  const gone = await prisma.mediaAsset.findUnique({ where: { id: asset.id } });
  assert.equal(gone, null);
});

// ===================================================================== SEO =

test("12. applySeoOverride returns the base Metadata completely unchanged when no override exists", async () => {
  const base = { title: "Generated Title", description: "Generated description.", openGraph: { title: "Generated Title" } };
  const result = await seoOverridesLib.applySeoOverride(base, "/no-override-here");
  assert.deepEqual(result, base);
});

test("13. upsertSeoOverride + applySeoOverride: only explicitly-set fields replace the generated default", async () => {
  await seoOverridesLib.upsertSeoOverride("/test-page", { title: "Custom Title" }, "a@x.com");

  const base = {
    title: "Generated Title",
    description: "Generated description.",
    openGraph: { title: "Generated Title", description: "Generated description.", type: "website" as const },
  };
  const result = await seoOverridesLib.applySeoOverride(base, "/test-page");

  assert.equal(result.title, "Custom Title", "title should be overridden");
  assert.equal(result.description, "Generated description.", "description was never set in the override, so it stays the generated default");
  assert.equal((result.openGraph as { title?: string })?.title, "Custom Title", "OG title should follow the override too");
});

test("14. resetSeoOverride removes the row and applySeoOverride reverts to the base metadata", async () => {
  await seoOverridesLib.resetSeoOverride("/test-page");
  const override = await seoOverridesLib.getSeoOverride("/test-page");
  assert.equal(override, null);

  const base = { title: "Generated Title", description: "Generated description." };
  const result = await seoOverridesLib.applySeoOverride(base, "/test-page");
  assert.deepEqual(result, base);
});

test("15. resetSeoOverride on a path with no override is a safe no-op", async () => {
  await assert.doesNotReject(() => seoOverridesLib.resetSeoOverride("/never-had-an-override"));
});

test("16. OG image integration: an override with ogImageAssetId resolves to that MediaAsset's URL", async () => {
  const asset = await prisma.mediaAsset.create({
    data: { url: "/uploads/media/og-test.png", fileName: "og-test.png", mimeType: "image/png", sizeBytes: 500 },
  });
  await seoOverridesLib.upsertSeoOverride("/og-test-page", { ogImageAssetId: asset.id }, "a@x.com");

  const result = await seoOverridesLib.applySeoOverride({ title: "T", description: "D" }, "/og-test-page");
  const images = (result.openGraph as { images?: { url: string }[] } | undefined)?.images;
  assert.equal(images?.[0]?.url, "/uploads/media/og-test.png");
});

test("17. SEO catalog: static pages resolve to their known fixed paths", () => {
  const home = seoCatalogLib.resolveStaticSeoBase("home", "hi");
  assert.equal(home.path, "/");
  const faq = seoCatalogLib.resolveStaticSeoBase("faq", "hi");
  assert.equal(faq.path, "/faq");
});

test("18. SEO catalog: state-scoped resolution returns null for an unknown state slug", async () => {
  const result = await seoCatalogLib.resolveStateScopedSeoBase("results", "not-a-real-state-slug", "hi");
  assert.equal(result, null);
});

test("19. SEO catalog: static pages resolve locale-correct title text (no accidental language mixing)", () => {
  const homeHi = seoCatalogLib.resolveStaticSeoBase("home", "hi");
  const homeEn = seoCatalogLib.resolveStaticSeoBase("home", "en");
  assert.notEqual(homeHi.title, homeEn.title);
  assert.match(homeHi.title, /[ऀ-ॿ]/);
  assert.doesNotMatch(homeEn.title, /[ऀ-ॿ]/);
});
