import { Suspense } from "react";
import { ConstituenciesManager } from "@/components/admin/ConstituenciesManager";

export default function AdminConstituenciesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Constituencies</h1>
      <p className="mt-1 text-sm text-muted">Every constituency belongs to a state and a district within that state.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <ConstituenciesManager />
        </Suspense>
      </div>
    </div>
  );
}
