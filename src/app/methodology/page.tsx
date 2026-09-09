import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How India Election Survey collects, validates and aggregates public survey responses.",
};

export default function MethodologyPage() {
  return (
    <Container className="max-w-3xl py-14 prose-headings:font-display">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Legal & methodology</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Methodology</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="What this is">
          India Election Survey is a voluntary, opt-in online public-opinion survey covering state assembly
          elections, constituency by constituency, for each state published on this platform. Anyone can
          participate; there is no sampling frame, quota, or attempt to represent any state&apos;s electorate
          proportionally. Results describe <em>survey respondents</em>, not the electorate as a whole.
        </Section>

        <Section title="How responses are collected">
          Each constituency, within a specific election, has one active survey with questions on candidate preference, party preference, the
          most important local issue, and optional demographics (age group, gender, social category, religion).
          Every optional question can be skipped. We never collect name, phone number, email, voter ID, Aadhaar,
          exact address, GPS location, or booth number.
        </Section>

        <Section title="Anti-manipulation measures">
          <ul className="list-disc space-y-1 pl-5">
            <li>Server-side validation of every question and option before a response is accepted.</li>
            <li>Rate limiting per network and per device fingerprint.</li>
            <li>Duplicate detection — one counted response per device per constituency survey per 24 hours.</li>
            <li>Burst detection flags unusually high submission volume from a single network in a short window.</li>
            <li>Every response is stored with a status: <code>VALID</code>, <code>FLAGGED</code>, or{" "}
              <code>REJECTED</code>. Only <code>VALID</code> responses are counted in public results.</li>
          </ul>
        </Section>

        <Section title="Small-sample protection">
          Any breakdown — a constituency total, or a demographic group within it — is only published once it has at
          least <strong>{MIN_ANALYTICS_GROUP_SIZE_DEFAULT}</strong> valid responses. Below that threshold we show
          &quot;insufficient responses&quot; rather than a number, both to keep the data statistically meaningful
          and to avoid any risk of identifying individual respondents from small or granular demographic slices.
        </Section>

        <Section title="Survey result vs. election result">
          Survey results are never described as election outcomes. Where one option leads, we say it{" "}
          <em>&quot;currently leads among survey respondents&quot;</em> — never that it &quot;will win&quot; the
          seat. Map and card visualisations that shade by survey standing are always labelled &quot;Current Survey
          Leader&quot;, never &quot;Winner&quot; or &quot;Result&quot;.
        </Section>

        <Section title="Candidate listings">
          Candidates are labelled Declared, Likely, Potential Contender, Incumbent, or Historical based on publicly
          available, source-cited information at the time of listing. A &quot;Potential Contender&quot; listing is
          not a claim of official nomination. Candidate photographs are sourced from official party pages,
          candidates&apos; own public profiles, Wikimedia Commons, or reputable news coverage — with the source URL,
          source name and retrieval date recorded — and reviewed before publication. Where no reliable photo exists,
          we show an initials avatar rather than fabricate or guess an image.
        </Section>

        <Section title="Neutrality">
          This platform does not promote or attack any party or candidate. Party and candidate ordering in surveys
          and lists follows a fixed or alphabetical order, never popularity or performance. We do not hide
          unfavourable results, and we do not fabricate respondents, percentages, or candidates.
        </Section>
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
