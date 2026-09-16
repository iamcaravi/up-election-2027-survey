import { Suspense } from "react";
import { AnalyticsManager } from "@/components/admin/AnalyticsManager";

export default function AdminAnalyticsIndexPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Survey Analytics</h1>
      <p className="mt-1 text-sm text-muted">Select a survey to view its aggregate analytics (internal engine preview).</p>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <AnalyticsManager />
        </Suspense>
      </div>
    </div>
  );
}
