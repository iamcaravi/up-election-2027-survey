import { StatesManager } from "@/components/admin/StatesManager";

export default function AdminStatesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">States</h1>
      <p className="mt-1 text-sm text-muted">
        The root scope for every election, district and constituency. No state is ever assumed by default.
      </p>
      <div className="mt-6">
        <StatesManager />
      </div>
    </div>
  );
}
