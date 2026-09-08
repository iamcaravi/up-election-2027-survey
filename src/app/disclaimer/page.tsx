import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Disclaimer</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/90">
        <p>
          This platform presents results from voluntary online survey responses. Survey results are not official
          election results and may not represent the views of the entire electorate.
        </p>
        <p>
          UP Election 2027 is an independent public-opinion survey product. It is not affiliated with, endorsed by,
          or run on behalf of the Election Commission of India, the Government of Uttar Pradesh, or any political
          party or candidate.
        </p>
        <p>
          During any period where the Election Commission&apos;s Model Code of Conduct or statutory silence period
          restricts publication of poll-related material, publication of new results on this platform will be
          paused or adjusted accordingly (see Admin → Settings → Election Period Controls).
        </p>
        <p>
          Candidate status labels (Declared, Likely, Potential Contender, Incumbent, Historical) reflect publicly
          available information at the time of listing and can change. They are not a statement of official
          nomination by any party or the Election Commission.
        </p>
      </div>
    </Container>
  );
}
