import "server-only";
import { prisma } from "./prisma";

// Reusable persistence layer for ContentBlock/ContentBlockVersion — the
// generalized draft/publish/version pattern first proven by
// FaqItem/FaqItemVersion, now available for any single-identity content
// "slot" identified by a stable slotKey (e.g. "legal.privacy",
// "homepage.hero.heading"). Every function here takes/returns already-
// parsed JS values; JSON encoding for storage is entirely internal.
//
// Intentional safety difference from FaqItem's restore behavior (per the
// approved Phase 2 review): restoreContentBlockVersion() only ever writes
// into draftValue — it NEVER touches publishedValue directly. An admin must
// still explicitly publish a restored version, so "restore" can never
// silently put old content live.

export type ContentBlockStatus = "DRAFT_ONLY" | "PUBLISHED" | "HAS_DRAFT";

export interface ContentBlockView {
  id: string;
  slotKey: string;
  contentType: string;
  draftValue: unknown;
  publishedValue: unknown;
  status: ContentBlockStatus;
  updatedAt: Date;
  updatedBy: string | null;
  publishedAt: Date | null;
}

function toView(row: {
  id: string;
  slotKey: string;
  contentType: string;
  draftValue: string | null;
  publishedValue: string;
  status: string;
  updatedAt: Date;
  updatedBy: string | null;
  publishedAt: Date | null;
}): ContentBlockView {
  return {
    id: row.id,
    slotKey: row.slotKey,
    contentType: row.contentType,
    draftValue: row.draftValue ? JSON.parse(row.draftValue) : null,
    publishedValue: JSON.parse(row.publishedValue),
    status: row.status as ContentBlockStatus,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    publishedAt: row.publishedAt,
  };
}

export async function listContentBlocks(): Promise<ContentBlockView[]> {
  const rows = await prisma.contentBlock.findMany({ orderBy: { slotKey: "asc" } });
  return rows.map(toView);
}

export async function getContentBlock(slotKey: string): Promise<ContentBlockView | null> {
  const row = await prisma.contentBlock.findUnique({ where: { slotKey } });
  return row ? toView(row) : null;
}

/** Creates a brand-new slot. The initial value is published immediately
 *  (there is no meaningful "draft of nothing" state for a slot that has
 *  never existed) — status PUBLISHED, no draft. */
export async function createContentBlock(params: {
  slotKey: string;
  contentType: string;
  initialValue: unknown;
  editorEmail: string;
}): Promise<ContentBlockView> {
  const row = await prisma.contentBlock.create({
    data: {
      slotKey: params.slotKey,
      contentType: params.contentType,
      publishedValue: JSON.stringify(params.initialValue),
      status: "PUBLISHED",
      updatedBy: params.editorEmail,
      publishedAt: new Date(),
    },
  });
  return toView(row);
}

/** Saves a draft. Does NOT touch publishedValue and does NOT write a
 *  ContentBlockVersion — versions are only ever created at publish time. */
export async function saveContentBlockDraft(params: {
  slotKey: string;
  value: unknown;
  editorEmail: string;
}): Promise<ContentBlockView> {
  const row = await prisma.contentBlock.update({
    where: { slotKey: params.slotKey },
    data: {
      draftValue: JSON.stringify(params.value),
      status: "HAS_DRAFT",
      updatedBy: params.editorEmail,
    },
  });
  return toView(row);
}

/** Publishes the current draft:
 *  1. Snapshots the CURRENT publishedValue into ContentBlockVersion.
 *  2. Copies draftValue → publishedValue.
 *  3. Clears draftValue.
 *  4. Sets status PUBLISHED.
 *  5. Sets publishedAt.
 *  6. Records the editor.
 *  Throws if the slot has no pending draft — publishing is only meaningful
 *  when there's something to publish. */
export async function publishContentBlock(params: { slotKey: string; editorEmail: string }): Promise<ContentBlockView> {
  const existing = await prisma.contentBlock.findUnique({ where: { slotKey: params.slotKey } });
  if (!existing) throw new Error(`No content block found for slot "${params.slotKey}".`);
  if (existing.draftValue === null) throw new Error("This content block has no draft to publish.");

  await prisma.contentBlockVersion.create({
    data: {
      slotKey: existing.slotKey,
      value: existing.publishedValue,
      createdBy: params.editorEmail,
    },
  });

  const row = await prisma.contentBlock.update({
    where: { slotKey: params.slotKey },
    data: {
      publishedValue: existing.draftValue,
      draftValue: null,
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedBy: params.editorEmail,
    },
  });
  return toView(row);
}

/** Discards the pending draft without publishing it or touching publishedValue. */
export async function discardContentBlockDraft(params: { slotKey: string; editorEmail: string }): Promise<ContentBlockView> {
  const row = await prisma.contentBlock.update({
    where: { slotKey: params.slotKey },
    data: { draftValue: null, status: "PUBLISHED", updatedBy: params.editorEmail },
  });
  return toView(row);
}

export interface ContentBlockVersionView {
  id: string;
  slotKey: string;
  value: unknown;
  createdAt: Date;
  createdBy: string | null;
}

export async function getContentBlockVersions(slotKey: string): Promise<ContentBlockVersionView[]> {
  const rows = await prisma.contentBlockVersion.findMany({ where: { slotKey }, orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({ id: r.id, slotKey: r.slotKey, value: JSON.parse(r.value), createdAt: r.createdAt, createdBy: r.createdBy }));
}

/** Loads a historical version's value into draftValue — deliberately NEVER
 *  writes publishedValue directly. An explicit publishContentBlock() call
 *  afterward is required to make a restored version live, so a restore can
 *  never silently overwrite what's currently on the public site. */
export async function restoreContentBlockVersion(params: {
  slotKey: string;
  versionId: string;
  editorEmail: string;
}): Promise<ContentBlockView> {
  const version = await prisma.contentBlockVersion.findUnique({ where: { id: params.versionId } });
  if (!version || version.slotKey !== params.slotKey) {
    throw new Error("Version not found for this content block.");
  }
  const row = await prisma.contentBlock.update({
    where: { slotKey: params.slotKey },
    data: { draftValue: version.value, status: "HAS_DRAFT", updatedBy: params.editorEmail },
  });
  return toView(row);
}
