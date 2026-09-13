import { PartiesManager } from "@/components/admin/PartiesManager";

export default function AdminPartiesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Parties</h1>
      <p className="mt-1 text-sm text-muted">
        Manage the party catalog and choose which parties are featured in each state&apos;s public survey.
      </p>
      <div className="mt-6">
        <PartiesManager />
      </div>
    </div>
  );
}
