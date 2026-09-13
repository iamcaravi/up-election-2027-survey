import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

// Purpose-built hero for the state-wide "___ चुनाव विश्लेषण" landing page —
// deliberately NOT the constituency SurveyHero (that component's
// props/element-editor are shaped around one specific constituency's
// breadcrumb/stats and don't apply state-wide). Reuses the same background
// photo and navy/tricolor visual language for continuity.
export function AnalysisHero({
  stateName,
  constituencyCount,
  electionYear,
  exploreHref,
  surveyHref,
}: {
  stateName: string;
  constituencyCount: number;
  electionYear: number;
  exploreHref: string;
  surveyHref: string;
}) {
  return (
    <div className="relative isolate overflow-hidden border-b border-border">
      <Image
        src="/images/survey/voter-survey-hero-2.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/85 to-white/40" aria-hidden="true" />

      <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-2xl">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <MapPin size={13} /> {stateName}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.05] text-ink sm:text-5xl">
            {stateName}
            <br />
            चुनाव विश्लेषण
          </h1>
          <p className="mt-2.5 text-base font-medium leading-relaxed text-foreground sm:text-lg">
            पूरे {stateName} में हो रहे जनमत सर्वेक्षण का विस्तृत विश्लेषण
          </p>
          <p className="mt-2 text-sm font-semibold text-muted">
            {constituencyCount} विधानसभा क्षेत्र • जनमत सर्वेक्षण • {electionYear} विधानसभा चुनाव
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={exploreHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-ink/5"
            >
              विधानसभा क्षेत्र देखें <ArrowRight size={18} />
            </Link>
            <LinkButton href={surveyHref} size="lg" variant="cta">
              सर्वे में भाग लें
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
