import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Is this an official election result?",
    a: "No. This platform presents results from voluntary online survey responses. It is not an official election result and does not represent the views of the entire electorate.",
  },
  {
    q: "Do I need an account to take a survey?",
    a: "No. Taking a survey does not require creating an account, and we do not ask for your name, phone number, email address, or any government ID.",
  },
  {
    q: "Can I take the survey more than once for the same constituency?",
    a: "Each response is checked for duplicates using anonymous, one-way hashes, so submitting the same constituency's survey multiple times from the same device or connection will not be counted more than once.",
  },
  {
    q: "Who runs this platform?",
    a: "This is an independent public-opinion survey product. It is not affiliated with, endorsed by, or run on behalf of the Election Commission of India, any state government, or any political party or candidate.",
  },
];

export default function FaqPage() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Support</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h1>
      <div className="mt-6 space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <h2 className="font-display text-base font-bold text-foreground">{item.q}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{item.a}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
