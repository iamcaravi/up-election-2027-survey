import { Suspense } from "react";
import { SurveyForm } from "@/components/admin/SurveyForm";

export default async function NewSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ stateId?: string }>;
}) {
  const { stateId } = await searchParams;
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Create Survey</h1>
      <p className="mt-1 text-sm text-muted">
        A survey can only be created for a constituency with a valid, active Election ↔ Constituency mapping.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <SurveyForm initialStateId={stateId} />
        </Suspense>
      </div>
    </div>
  );
}
