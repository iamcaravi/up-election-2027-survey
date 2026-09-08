import { CandidateForm } from "@/components/admin/CandidateForm";

export default function NewCandidatePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Add Candidate</h1>
      <p className="mt-1 text-sm text-muted">
        Never fabricate a candidate. Only add candidates you can source and cite.
      </p>
      <div className="mt-6">
        <CandidateForm />
      </div>
    </div>
  );
}
