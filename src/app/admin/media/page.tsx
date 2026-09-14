import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default function AdminMediaPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Media Library</h1>
      <p className="mt-1 text-sm text-muted">
        Upload and manage images for use across the admin — e.g. as an SEO Open Graph image. Additive: existing
        feature-specific uploads (Hero background, Survey Hero elements, candidate photos) are unaffected.
      </p>
      <div className="mt-6">
        <MediaLibrary />
      </div>
    </div>
  );
}
