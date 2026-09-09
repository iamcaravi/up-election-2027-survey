import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CandidateForm } from "@/components/admin/CandidateForm";

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { constituency: { include: { district: true } } },
  });
  if (!candidate) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Edit Candidate</h1>
      <div className="mt-6">
        <CandidateForm
          initial={{
            id: candidate.id,
            name: candidate.name,
            nameHindi: candidate.nameHindi,
            partyId: candidate.partyId,
            status: candidate.status,
            confidenceScore: candidate.confidenceScore,
            currentOffice: candidate.currentOffice,
            background: candidate.background,
            sourceNotes: candidate.sourceNotes,
            verified: candidate.verified,
            photoUrl: candidate.photoUrl,
            photoSourceUrl: candidate.photoSourceUrl,
            photoSourceName: candidate.photoSourceName,
            photoLicense: candidate.photoLicense,
            constituency: {
              id: candidate.constituency.id,
              name: candidate.constituency.name,
              number: candidate.constituency.number,
              district: { name: candidate.constituency.district.name },
            },
          }}
        />
      </div>
    </div>
  );
}
