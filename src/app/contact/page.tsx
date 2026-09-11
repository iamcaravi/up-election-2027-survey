import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Support</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Contact Us</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          For questions about this platform, to report an issue with a survey, or to flag inaccurate candidate
          information, please reach out to the site administrators.
        </p>
        <p>
          This platform is an independent public-opinion survey product and is not affiliated with the Election
          Commission of India, any state government, or any political party or candidate.
        </p>
      </div>
    </Container>
  );
}
