import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SurveyForm } from "@/components/admin/SurveyForm";

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      election: { select: { id: true, name: true, year: true, state: { select: { id: true, name: true } } } },
      constituency: { select: { id: true, name: true, number: true, district: { select: { id: true, name: true } } } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey || !survey.constituency) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Edit Survey</h1>
      <div className="mt-6">
        <SurveyForm
          initial={{
            id: survey.id,
            title: survey.title,
            description: survey.description,
            status: survey.status,
            isActive: survey.isActive,
            minimumSampleSize: survey.minimumSampleSize,
            responseCount: survey._count.responses,
            election: survey.election,
            constituency: survey.constituency,
          }}
        />
      </div>
    </div>
  );
}
