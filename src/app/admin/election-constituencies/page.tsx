import { Suspense } from "react";
import { ElectionConstituenciesManager } from "@/components/admin/ElectionConstituenciesManager";

export default function AdminElectionConstituenciesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Election ↔ Constituency Mapping</h1>
      <p className="mt-1 text-sm text-muted">
        Controls which constituencies a given election contests. A constituency only appears on the public site for
        an election once it is mapped here.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <ElectionConstituenciesManager />
        </Suspense>
      </div>
    </div>
  );
}
