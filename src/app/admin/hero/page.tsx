import { getSiteSetting } from "@/lib/data";
import { DEFAULT_HERO_CONFIG, normalizeHeroConfig } from "@/lib/hero-config";
import { HeroEditorForm } from "@/components/admin/HeroEditorForm";

export default async function AdminHeroPage() {
  const heroConfig = normalizeHeroConfig(await getSiteSetting("HERO_CONFIG", DEFAULT_HERO_CONFIG));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Hero Editor</h1>
      <p className="mt-1 text-sm text-muted">
        Edit the homepage hero&apos;s text, typography and position. The background artwork stays fixed — this only
        controls the editable HTML layer rendered on top of it.
      </p>
      <div className="mt-6">
        <HeroEditorForm initialConfig={heroConfig} />
      </div>
    </div>
  );
}
