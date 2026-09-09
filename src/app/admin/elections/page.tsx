import { Suspense } from "react";
import { ElectionsManager } from "@/components/admin/ElectionsManager";

export default function AdminElectionsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Elections</h1>
      <p className="mt-1 text-sm text-muted">Every election belongs to exactly one state. Pick a state to manage its elections.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <ElectionsManager />
        </Suspense>
      </div>
    </div>
  );
}
