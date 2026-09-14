import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";

const CONTACT_EMAIL = "votersurveyindia@gmail.com";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with VoterSurvey.in for general enquiries, survey or data questions, technical support, privacy requests, or election/regulatory communication.",
  path: "/contact",
});

const CONTACT_CATEGORIES = [
  {
    title: "General Enquiries",
    body: "Questions about VoterSurvey.in, how the platform works, or anything not covered by the categories below.",
  },
  {
    title: "Survey / Data Questions",
    body: "Questions about a specific survey, how a result or percentage was calculated, or how constituency-level data is shown.",
  },
  {
    title: "Technical Support",
    body: "A page not loading correctly, a broken link, or unexpected behaviour on the website.",
  },
  {
    title: "Privacy / Data Requests",
    body: "Questions about what data is collected, or a request relating to information you believe concerns you. See our Privacy Policy for details on what is (and isn't) collected.",
  },
  {
    title: "Election / Regulatory Communication",
    body: "Communication from the Election Commission of India, a State Election Commission, or another competent authority regarding this website or its content. See our Disclaimer for the platform's regulatory cooperation clause.",
  },
];

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: "Help" }, { label: "Contact Us" }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Support</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Contact Us</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          VoterSurvey.in is an independent, voluntary public-opinion survey platform. It is not affiliated with,
          operated by, endorsed by, or officially associated with the Election Commission of India or any State
          Election Commission unless explicitly stated otherwise, and is not affiliated with any political party or
          candidate.
        </p>
      </div>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)] transition-colors hover:border-accent"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Mail size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Email us</span>
          <span className="block truncate font-display text-lg font-bold text-ink">{CONTACT_EMAIL}</span>
        </span>
      </a>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-foreground">What can we help with?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONTACT_CATEGORIES.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-display text-sm font-bold text-foreground">{c.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        We aim to respond to genuine enquiries in a reasonable time. Please include enough detail (e.g. the page URL,
        state/constituency, or a screenshot) so we can look into it quickly.
      </p>
    </Container>
  );
}
