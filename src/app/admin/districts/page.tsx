import { Suspense } from "react";
import { DistrictsManager } from "@/components/admin/DistrictsManager";

export default function AdminDistrictsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Districts</h1>
      <p className="mt-1 text-sm text-muted">Every district belongs to exactly one state. Pick a state to manage its districts.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <DistrictsManager />
        </Suspense>
      </div>
    </div>
  );
}
