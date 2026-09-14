import { FaqManager } from "@/components/admin/FaqManager";

export default function AdminFaqPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">FAQ</h1>
      <p className="mt-1 text-sm text-muted">Create, edit, publish and reorder the questions shown on the public FAQ page.</p>
      <div className="mt-6">
        <FaqManager />
      </div>
    </div>
  );
}
