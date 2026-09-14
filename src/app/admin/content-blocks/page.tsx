import { ContentBlocksManager } from "@/components/admin/ContentBlocksManager";

export default function AdminContentBlocksPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Content Blocks</h1>
      <p className="mt-1 text-sm text-muted">
        Foundation for versioned, draft/publish website content. Nothing on the public site reads from these blocks yet —
        this phase proves the persistence, draft/publish and version-restore architecture before any real page content is
        migrated onto it.
      </p>
      <div className="mt-6">
        <ContentBlocksManager />
      </div>
    </div>
  );
}
