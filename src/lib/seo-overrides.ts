import "server-only";
import type { Metadata } from "next";
import { prisma } from "./prisma";

export interface SeoOverrideInput {
  title?: string | null;
  description?: string | null;
  ogImageAssetId?: string | null;
  noindex?: boolean;
}

export async function getSeoOverride(path: string) {
  return prisma.seoOverride.findUnique({ where: { path } });
}

export async function listSeoOverrides() {
  return prisma.seoOverride.findMany({ orderBy: { path: "asc" } });
}

export async function upsertSeoOverride(path: string, data: SeoOverrideInput, editorEmail: string) {
  return prisma.seoOverride.upsert({
    where: { path },
    update: { ...data, updatedBy: editorEmail },
    create: { path, ...data, updatedBy: editorEmail },
  });
}

/** No-op when no override exists for `path` — resetting an already-default
 *  page is always safe. */
export async function resetSeoOverride(path: string): Promise<void> {
  await prisma.seoOverride.deleteMany({ where: { path } });
}

// Layers a persisted SeoOverride on top of an already-built Metadata object
// (the output of buildPageMetadata(), src/lib/seo.ts) — only replaces
// fields explicitly configured in the override row, and returns `base`
// completely unchanged when no override row exists for `path`. Deliberately
// never touches `base.alternates` (canonical-URL construction stays
// buildPageMetadata()'s alone) — there is no way to override canonical
// through this function, by design.
export async function applySeoOverride(base: Metadata, path: string): Promise<Metadata> {
  const override = await getSeoOverride(path);
  if (!override) return base;

  const title = override.title || undefined;
  const description = override.description || undefined;

  let ogImageUrl: string | undefined;
  if (override.ogImageAssetId) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: override.ogImageAssetId } });
    ogImageUrl = asset?.url;
  }

  const openGraph: Metadata["openGraph"] = {
    ...base.openGraph,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
  };

  const twitter: Metadata["twitter"] = {
    ...base.twitter,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  };

  return {
    ...base,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph,
    twitter,
    ...(override.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
