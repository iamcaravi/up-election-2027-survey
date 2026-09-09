import { Suspense } from "react";
import { SurveysManager } from "@/components/admin/SurveysManager";

export default function AdminSurveysPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Surveys</h1>
      <p className="mt-1 text-sm text-muted">Every survey belongs to exactly one election and one constituency.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <SurveysManager />
        </Suspense>
      </div>
    </div>
  );
}
