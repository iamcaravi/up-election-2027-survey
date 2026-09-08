"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { cn } from "@/lib/utils";

interface ImageData {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  license: string | null;
  status: string;
  candidateName: string;
  constituencyName: string;
  retrievedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-accent/15 text-[#8a6a15]",
  VERIFIED: "bg-positive/15 text-positive",
  REJECTED: "bg-danger/15 text-danger",
  REPLACE: "bg-ink/10 text-ink",
};

export function ImageReviewRow({ image }: { image: ImageData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    await fetch(`/api/admin/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card-surface flex flex-wrap items-center gap-4 rounded-2xl p-4">
      <CandidateAvatar name={image.candidateName} photoUrl={image.imageUrl} size={56} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{image.candidateName}</p>
        <p className="text-xs text-muted">{image.constituencyName}</p>
        <p className="mt-1 truncate text-xs text-muted">
          Source: <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="underline">{image.sourceName}</a>
          {image.license && ` · ${image.license}`}
        </p>
      </div>
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase", STATUS_COLORS[image.status])}>
        {image.status}
      </span>
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => setStatus("VERIFIED")}
          className="rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-semibold text-positive hover:bg-positive/20"
        >
          Verify
        </button>
        <button
          disabled={loading}
          onClick={() => setStatus("REJECTED")}
          className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20"
        >
          Reject
        </button>
        <button
          disabled={loading}
          onClick={() => setStatus("REPLACE")}
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-border"
        >
          Needs Replace
        </button>
      </div>
    </div>
  );
}
