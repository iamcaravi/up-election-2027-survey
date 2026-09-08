import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          Taking a survey on this platform does not require an account. We do not ask for or store your name, phone
          number, email address, voter ID, Aadhaar number, exact address, GPS location, or polling booth.
        </p>
        <p>
          Each response is linked only to: the constituency survey it was submitted to, your answers, a salted
          one-way hash of your IP address, and a salted one-way hash of a random device identifier stored in your
          browser&apos;s local storage. These hashes are used solely to detect duplicate or abusive submissions and
          cannot be reversed to recover your IP address or device identifier.
        </p>
        <p>
          Demographic answers (age group, gender, social category, religion) are optional, and every field can be
          skipped. They are used only to compute anonymous, aggregate breakdowns, and are never published or
          exported at the individual-response level. Any group with fewer than the configured minimum number of
          responses is withheld from public display.
        </p>
        <p>
          We do not build individual political profiles, and we do not sell or share response data with third
          parties.
        </p>
      </div>
    </Container>
  );
}
