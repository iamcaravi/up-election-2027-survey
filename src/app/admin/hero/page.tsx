import { getHomeStats, getSiteSetting, getStates } from "@/lib/data";
import { DEFAULT_HERO_CONFIG, normalizeHeroConfig } from "@/lib/hero-config";
import { DEFAULT_HOMEPAGE_SECTIONS_CONFIG, normalizeHomepageSectionsConfig } from "@/lib/homepage-sections-config";
import { electionPath, statePath } from "@/lib/routes";
import { HeroEditorForm } from "@/components/admin/HeroEditorForm";
import { HomepageSectionsForm } from "@/components/admin/HomepageSectionsForm";

export default async function AdminHeroPage() {
  const [heroConfigRaw, sectionsConfigRaw, states, stats] = await Promise.all([
    getSiteSetting("HERO_CONFIG", DEFAULT_HERO_CONFIG),
    getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG),
    getStates(),
    getHomeStats(),
  ]);
  const heroConfig = normalizeHeroConfig(heroConfigRaw);
  const sectionsConfig = normalizeHomepageSectionsConfig(sectionsConfigRaw);

  const primary = states[0] ?? null;
  const primaryElection = primary?.elections[0] ?? null;
  const surveyHref = primary ? statePath(primary.slug) : "/states";
  const resultsHref = primary && primaryElection ? electionPath(primary.slug, primaryElection.slug) : surveyHref;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Homepage Editor</h1>
      <p className="mt-1 text-sm text-muted">
        Edit the homepage separately for Mobile, Tablet and Desktop. Changes here are a draft until you click{" "}
        <strong>Save Changes</strong> — only then does the public homepage use them.
      </p>

      <div className="mt-6">
        <HomepageSectionsForm
          initialConfig={sectionsConfig}
          heroConfig={heroConfig}
          previewStates={states}
          previewStats={stats}
          surveyHref={surveyHref}
          resultsHref={resultsHref}
        />
      </div>

      <details className="mt-10 rounded-2xl border border-border">
        <summary className="cursor-pointer px-5 py-4 font-display text-lg font-bold">
          Hero — Advanced Text &amp; Position Editor
        </summary>
        <div className="border-t border-border p-5">
          <p className="mb-4 text-sm text-muted">
            Fine-grained control over the Hero&apos;s background photo crop/zoom and each text element&apos;s position,
            typography and wording per breakpoint. The background artwork itself stays fixed — this only controls the
            editable layer rendered on top of it. Note: once a Mobile (and optionally Tablet) image is set above, mobile
            visitors see that single image instead of this text layer, so its Mobile/Tablet tiers here mainly matter if
            those images are later removed.
          </p>
          <HeroEditorForm initialConfig={heroConfig} />
        </div>
      </details>
    </div>
  );
}
