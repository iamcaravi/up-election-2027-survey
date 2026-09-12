import { getSiteSetting } from "@/lib/data";
import { DEFAULT_HERO_ELEMENTS_CONFIG, normalizeHeroElementsConfig, SURVEY_HERO_ELEMENTS_KEY } from "@/lib/survey-hero-elements-config";
import { HeroEditor } from "@/components/admin/hero-editor/HeroEditor";

export default async function AdminSurveyHeroPage() {
  const globalConfigRaw = await getSiteSetting(SURVEY_HERO_ELEMENTS_KEY, DEFAULT_HERO_ELEMENTS_CONFIG);
  const globalConfig = normalizeHeroElementsConfig(globalConfigRaw);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Hero Visual Editor</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        A Canva-style editor for the survey page&apos;s constituency hero/banner. Click any element on the canvas or in
        the Hero Elements list to select it, then drag to move, use the corner handle to resize, and fine-tune it in
        the panel on the right. Set a global default that applies to every constituency, or pick one constituency to
        override it individually. Nothing changes on the public site until you click <strong>Save Changes</strong>.
      </p>

      <div className="mt-6">
        <HeroEditor initialGlobal={globalConfig} />
      </div>
    </div>
  );
}
