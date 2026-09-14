import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  resolveStaticSeoBase,
  resolveStateScopedSeoBase,
  SEO_STATIC_CATALOG,
  SEO_STATE_SCOPED_CATALOG,
  type SeoStaticCategory,
  type SeoStateScopedCategory,
} from "@/lib/seo-catalog";
import { getSeoOverride } from "@/lib/seo-overrides";

const STATIC_CATEGORIES = new Set(SEO_STATIC_CATALOG.map((e) => e.category));
const STATE_SCOPED_CATEGORIES = new Set(SEO_STATE_SCOPED_CATALOG.map((e) => e.category));

// Resolves {path, generatedTitle, generatedDescription, override} for a
// chosen page — the admin SEO editor calls this before showing the
// "Generated Default" vs "Custom Override" comparison, and again when the
// admin switches which state a State/Results/Analysis override targets.
// The path itself is always server-resolved from a real state/election
// lookup (never accepted as free text from the client) — this is what
// prevents an admin from ever creating an override for an arbitrary,
// non-existent canonical URL.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");
  const stateSlug = req.nextUrl.searchParams.get("stateSlug");

  // The admin editor's "Generated Default" preview always shows the site's
  // default-locale (Hindi) copy — admin is intentionally left out of the
  // public locale toggle's scope (see AGENTS/plan notes); an admin who wants
  // to see the English default can check the live English page directly.
  if (category && STATIC_CATEGORIES.has(category as SeoStaticCategory)) {
    const base = resolveStaticSeoBase(category as SeoStaticCategory, "hi");
    const override = await getSeoOverride(base.path);
    return NextResponse.json({ path: base.path, generatedTitle: base.title, generatedDescription: base.description, override });
  }

  if (category && STATE_SCOPED_CATEGORIES.has(category as SeoStateScopedCategory)) {
    if (!stateSlug) return NextResponse.json({ error: "Missing required ?stateSlug=" }, { status: 400 });
    const base = await resolveStateScopedSeoBase(category as SeoStateScopedCategory, stateSlug, "hi");
    if (!base) return NextResponse.json({ error: "Could not resolve this state/election." }, { status: 404 });
    const override = await getSeoOverride(base.path);
    return NextResponse.json({ path: base.path, generatedTitle: base.title, generatedDescription: base.description, override });
  }

  return NextResponse.json({ error: "Unknown or missing ?category=" }, { status: 400 });
}
