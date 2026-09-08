import { prisma } from "@/lib/prisma";
import { ImageReviewRow } from "@/components/admin/ImageReviewRow";

export default async function AdminImagesPage() {
  const images = await prisma.imageSource.findMany({
    include: { candidate: { include: { constituency: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Image Review</h1>
      <p className="mt-1 text-sm text-muted">
        Candidate photos sourced automatically or by admins wait here until verified before being fully trusted on
        the public site.
      </p>

      <div className="mt-6 space-y-3">
        {images.length === 0 && (
          <div className="card-surface rounded-2xl p-8 text-center text-muted">No images submitted yet.</div>
        )}
        {images.map((img) => (
          <ImageReviewRow
            key={img.id}
            image={{
              id: img.id,
              imageUrl: img.imageUrl,
              sourceUrl: img.sourceUrl,
              sourceName: img.sourceName,
              license: img.license,
              status: img.status,
              candidateName: img.candidate.name,
              constituencyName: img.candidate.constituency.name,
              retrievedAt: img.retrievedAt.toISOString(),
            }}
          />
        ))}
      </div>
    </div>
  );
}
