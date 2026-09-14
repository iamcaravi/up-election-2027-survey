import { SeoManager } from "@/components/admin/SeoManager";

export default function AdminSeoPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">SEO</h1>
      <p className="mt-1 text-sm text-muted">
        Override the title, description, OG image or noindex for a specific page. Fields left blank keep using the
        site&apos;s generated default — canonical URLs, robots.txt and the sitemap are never affected by this screen.
      </p>
      <div className="mt-6">
        <SeoManager />
      </div>
    </div>
  );
}
