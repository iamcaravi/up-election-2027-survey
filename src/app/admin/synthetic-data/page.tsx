import { SyntheticDataPanel } from "@/components/admin/SyntheticDataPanel";

export default function AdminSyntheticDataPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Demo Data Mode</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Generate a realistic-looking synthetic survey dataset across a chosen state&apos;s assembly constituencies
        for UI/development testing. Synthetic responses are tagged <code>data_source: &quot;synthetic_demo&quot;</code> and
        are kept completely separate from real survey responses at the query level — enabling Demo Data Mode never
        deletes or modifies real data, it only changes which dataset the public results pages read from.
      </p>

      <div className="mt-6 max-w-2xl">
        <SyntheticDataPanel />
      </div>
    </div>
  );
}
