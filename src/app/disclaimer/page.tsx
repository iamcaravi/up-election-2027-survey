import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteBranding } from "@/lib/site-branding";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";

const LAST_UPDATED = "14 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const base = resolveStaticSeoBase("disclaimer");
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-bold text-foreground">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export default async function DisclaimerPage() {
  const { contactEmail: CONTACT_EMAIL } = await getSiteBranding();

  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: "Legal" }, { label: "Disclaimer" }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Disclaimer</h1>
      <p className="mt-2 text-xs text-muted">Effective / last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8">
        <Section n={1} title="Nature of this platform">
          <p>
            VoterSurvey.in is an independent, voluntary opinion/survey platform. It collects public-opinion survey
            responses for informational and statistical purposes only.
          </p>
        </Section>

        <Section n={2} title="Not the Election Commission of India">
          <p>
            VoterSurvey.in is <strong>not</strong> the Election Commission of India (ECI) and is{" "}
            <strong>
              not affiliated with, operated by, endorsed by, or officially associated with the Election Commission of
              India or any State Election Commission
            </strong>{" "}
            unless explicitly stated otherwise. VoterSurvey.in is also not affiliated with any political party or
            candidate.
          </p>
        </Section>

        <Section n={3} title="Survey results are not election results">
          <p>
            Survey results shown on this platform are <strong>not official election results</strong> and are not a
            guarantee, prediction, or representation of the final election outcome. Results are based solely on
            responses received through this platform.
          </p>
          <p>
            Data may be subject to sampling limitations, response bias, incomplete participation, and other
            statistical limitations. Party support and issue percentages should be interpreted as{" "}
            <strong>survey responses</strong>, not votes actually cast. Users should not treat this platform as an
            official election information source — see §6 below for where to find official information.
          </p>
        </Section>

        <Section n={4} title="Regulatory cooperation">
          <p>
            If the Election Commission of India, the concerned State Election Commission, or another competent
            statutory authority communicates with VoterSurvey.in regarding any applicable election law, regulation,
            direction, notice, restriction, or concern relating to this website or its content, the platform will
            provide a reasonable channel for such communication and will cooperate in addressing the matter in
            accordance with applicable law and directions. Regulatory communications may be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section n={5} title="Election-period restrictions">
          <p>
            Election-period restrictions — including applicable restrictions concerning opinion polls, exit polls,
            and the publication of election-related material — may apply depending on the specific election,
            jurisdiction, and timing. Users should refer to official instructions and applicable law where relevant.
            During any period where such restrictions apply, publication of new results on this platform may be
            paused or adjusted accordingly.
          </p>
        </Section>

        <Section n={6} title="Where to find official information">
          <p>
            For official election information, schedules, and results, please refer to the Election Commission of
            India (
            <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
              eci.gov.in
            </a>
            ) and the relevant State Election Commission&apos;s official channels.
          </p>
        </Section>

        <Section n={7} title="Candidate information">
          <p>
            Candidate status labels (Declared, Likely, Potential Contender, Incumbent, Historical) reflect publicly
            available information at the time of listing and can change. They are not a statement of official
            nomination by any party or the Election Commission.
          </p>
        </Section>

        <Section n={8} title="No legal endorsement or authorization claimed">
          <p>
            VoterSurvey.in does not claim to be legally &quot;approved&quot;, &quot;certified&quot;,
            &quot;registered&quot;, or &quot;authorized&quot; by the Election Commission of India or any State
            Election Commission.
          </p>
        </Section>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Questions about this disclaimer can be sent to{" "}
        <Link href="/contact" className="font-semibold text-accent hover:underline">
          Contact Us
        </Link>
        .
      </p>
    </Container>
  );
}
