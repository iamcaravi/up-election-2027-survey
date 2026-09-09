// Phase 14 — Admin Data Management Foundation: invariant tests for the new
// States/Elections/Districts/Constituencies/ElectionConstituency admin CRUD.
// Runs against an ephemeral SQLite database (never prisma/dev.db). See
// tests/helpers/fixtures.ts for the deliberately colliding two-state fixture.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import { seedFixtures } from "./helpers/fixtures";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let fx: Awaited<ReturnType<typeof seedFixtures>>;
let guards: typeof import("../src/lib/admin-guards");

before(async () => {
  const db = setupTestDb("test-admin-hierarchy");
  prisma = db.prisma;
  dbPath = db.dbPath;
  // Must be set BEFORE any dynamic import of a module that touches the
  // src/lib/prisma singleton (admin-guards, data.ts) — otherwise that
  // singleton binds to whatever DATABASE_URL this process inherited,
  // which can be the real prisma/dev.db.
  process.env.DATABASE_URL = `file:${dbPath}`;
  guards = await import("../src/lib/admin-guards");
  fx = await seedFixtures(prisma);
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

test("1. state creation/update validation: unique slug and code are enforced at the DB level", async () => {
  const state = await prisma.state.create({ data: { name: "Test State Gamma", slug: "test-state-gamma", code: "TSG" } });
  assert.ok(state.id);
  const updated = await prisma.state.update({ where: { id: state.id }, data: { name: "Test State Gamma Renamed" } });
  assert.equal(updated.name, "Test State Gamma Renamed");
});

test("2. duplicate state slug is rejected", async () => {
  await assert.rejects(() =>
    prisma.state.create({ data: { name: "Duplicate Alpha", slug: fx.stateA.slug, code: "DUPX" } })
  );
});

test("3. election cannot reference an invalid state (foreign key rejected)", async () => {
  await assert.rejects(() =>
    prisma.election.create({ data: { stateId: "does-not-exist", name: "Ghost Election", slug: "ghost", year: 2030 } })
  );
});

test("4. district cannot be assigned to the wrong state", async () => {
  // districtA genuinely belongs to stateA — asking to attach it to stateB
  // must be rejected by the guard used before any constituency creation.
  const blocker = await guards.assertDistrictInState(prisma, fx.stateB.id, fx.districtA.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /does not belong to the selected state/);

  // The matching state must pass with no blocker.
  const ok = await guards.assertDistrictInState(prisma, fx.stateA.id, fx.districtA.id);
  assert.equal(ok, null);
});

test("5. constituency cannot be assigned to a district from another state", async () => {
  // Same guard function is used by both constituency create and the
  // districtId-change path on update — verify both directions fail.
  const blocker = await guards.assertDistrictInState(prisma, fx.stateA.id, fx.districtB.id);
  assert.ok(blocker);
});

test("6. ElectionConstituency cannot map across states", async () => {
  const blocker = await guards.assertElectionConstituencySameState(prisma, fx.electionA.id, fx.constituencyB.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /different state/);

  const ok = await guards.assertElectionConstituencySameState(prisma, fx.electionA.id, fx.constituencyA.id);
  assert.equal(ok, null);
});

test("7. duplicate ElectionConstituency mapping is rejected", async () => {
  // electionA/constituencyA are already mapped in the fixture (ecA).
  await assert.rejects(() =>
    prisma.electionConstituency.create({ data: { electionId: fx.electionA.id, constituencyId: fx.constituencyA.id } })
  );
});

test("8. candidate cannot be created for a mismatched election/constituency pair", async () => {
  // Same state's constituency but the WRONG election (never contested it).
  const otherElectionBlocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionB.id, fx.constituencyA.id);
  assert.ok(otherElectionBlocker);

  // Cross-state mismatch must also be rejected.
  const crossStateBlocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyB.id);
  assert.ok(crossStateBlocker);

  // The real, active pairing must pass.
  const ok = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyA.id);
  assert.equal(ok, null);

  // A constituency that exists in the right state but was never linked to
  // this election (constituencyAUnlinked) must also be rejected.
  const unlinkedBlocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyAUnlinked.id);
  assert.ok(unlinkedBlocker);
});

test("9. survey cannot be associated with a mismatched election/constituency pair", async () => {
  // Surveys use the exact same membership invariant as candidates.
  const blocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionB.id, fx.constituencyA.id);
  assert.ok(blocker);
});

test("10. unsafe deletion is rejected for every hierarchy level", async () => {
  const stateBlocker = await guards.getStateDeletionBlockers(prisma, fx.stateA.id);
  assert.ok(stateBlocker); // stateA has elections/districts/constituencies

  const electionBlocker = await guards.getElectionDeletionBlockers(prisma, fx.electionA.id);
  assert.ok(electionBlocker); // electionA has candidates/surveys/mappings

  const districtBlocker = await guards.getDistrictDeletionBlockers(prisma, fx.districtA.id);
  assert.ok(districtBlocker); // districtA has constituencies
  assert.equal(districtBlocker!.error, "Cannot delete district because constituencies are still associated with it.");

  const constituencyBlocker = await guards.getConstituencyDeletionBlockers(prisma, fx.constituencyA.id);
  assert.ok(constituencyBlocker); // constituencyA has candidates/surveys

  const ecBlocker = await guards.getElectionConstituencyRemovalBlockers(prisma, fx.electionA.id, fx.constituencyA.id);
  assert.ok(ecBlocker); // has candidateA + surveyA

  // A genuinely empty, freshly-created state/district must be deletable
  // (no blocker) — proves the guard isn't just always rejecting.
  const emptyState = await prisma.state.create({ data: { name: "Empty State", slug: "empty-state", code: "EMP" } });
  assert.equal(await guards.getStateDeletionBlockers(prisma, emptyState.id), null);

  const emptyDistrict = await prisma.district.create({ data: { stateId: emptyState.id, name: "Empty District", slug: "empty-district" } });
  assert.equal(await guards.getDistrictDeletionBlockers(prisma, emptyDistrict.id), null);
});

test("11. every new admin route requires an authenticated session before any mutation", () => {
  const routeFiles = [
    "src/app/api/admin/states/route.ts",
    "src/app/api/admin/states/[id]/route.ts",
    "src/app/api/admin/elections/route.ts",
    "src/app/api/admin/elections/[id]/route.ts",
    "src/app/api/admin/districts/route.ts",
    "src/app/api/admin/districts/[id]/route.ts",
    "src/app/api/admin/constituencies/route.ts",
    "src/app/api/admin/constituencies/[id]/route.ts",
    "src/app/api/admin/election-constituencies/route.ts",
    "src/app/api/admin/election-constituencies/[id]/route.ts",
  ];
  const repoRoot = path.resolve(__dirname, "..");
  for (const file of routeFiles) {
    const source = readFileSync(path.join(repoRoot, file), "utf-8");
    // Every exported HTTP handler must call getAdminSession() and 401 when absent.
    const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE)/g) ?? []).length;
    const authCheckCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
    const unauthorizedCount = (source.match(/status:\s*401/g) ?? []).length;
    assert.ok(handlerCount > 0, `${file} exports no HTTP handlers`);
    assert.equal(authCheckCount, handlerCount, `${file}: expected one getAdminSession() call per handler`);
    assert.ok(unauthorizedCount >= handlerCount, `${file}: expected a 401 response per handler`);
  }
});

test("12. existing multi-state public API behavior remains intact (data.ts unaffected by admin-guards)", async () => {
  const dataLib = await import("../src/lib/data");
  const resultA = await dataLib.getStateAndElection("test-state-alpha", "test-election-2030");
  const resultB = await dataLib.getStateAndElection("test-state-beta", "test-election-2030");
  assert.equal(resultA?.election?.id, fx.electionA.id);
  assert.equal(resultB?.election?.id, fx.electionB.id);
});

test("13. Uttar Pradesh legacy default-slug fallback still resolves correctly", async () => {
  const dataLib = await import("../src/lib/data");
  const { districts } = await dataLib.getDistricts("uttar-pradesh");
  assert.equal(districts.length, 1);
  assert.equal(districts[0].id, fx.districtUP.id);
});

test("14. no implicit state fallback has been reintroduced in the new admin routes", () => {
  const routeFiles = [
    "src/app/api/admin/states/route.ts",
    "src/app/api/admin/elections/route.ts",
    "src/app/api/admin/districts/route.ts",
    "src/app/api/admin/constituencies/route.ts",
    "src/app/api/admin/election-constituencies/route.ts",
  ];
  const repoRoot = path.resolve(__dirname, "..");
  for (const file of routeFiles) {
    const source = readFileSync(path.join(repoRoot, file), "utf-8");
    assert.ok(!/["'`]uttar-pradesh["'`]/.test(source), `${file} must never hard-code a default state`);
    // The scope param (stateId/electionId) must be required (400 if missing),
    // never silently defaulted via `?? "something"`.
    assert.ok(
      !/(stateId|electionId)\s*=\s*req\.nextUrl\.searchParams\.get\([^)]+\)\s*\?\?/.test(source),
      `${file} must not silently default its scope parameter`
    );
  }
});
