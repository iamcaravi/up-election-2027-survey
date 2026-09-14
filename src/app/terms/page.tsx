import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";

export async function generateMetadata(): Promise<Metadata> {
  const base = resolveStaticSeoBase("terms");
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: "Legal" }, { label: "Terms of Use" }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Terms of Use</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>By using this platform, you agree not to submit automated, bulk, or fraudulent survey responses, and not to attempt to identify individual respondents from published data.</p>
        <p>Content on this site — survey results, candidate listings, and analytics — is provided for informational purposes only and should not be relied upon as an official election result or as investment, legal, or financial advice.</p>
        <p>
          Candidate information is sourced from public records and reputable reporting; we correct errors promptly
          when notified. <Link href="/contact" className="font-semibold text-accent hover:underline">Contact us</Link> to
          report inaccurate information about a listed candidate.
        </p>
      </div>
    </Container>
  );
}
