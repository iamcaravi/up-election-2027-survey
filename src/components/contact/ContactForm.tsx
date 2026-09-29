"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { Locale } from "@/lib/i18n/LocaleProvider";

interface ContactFormProps {
  locale: Locale;
  contactEmail: string;
  subjectOptions: string[];
}

const COPY: Record<
  Locale,
  {
    heading: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    errorRequired: string;
    errorEmail: string;
  }
> = {
  hi: {
    heading: "संदेश भेजें",
    name: "नाम",
    namePlaceholder: "अपना नाम लिखें",
    email: "ईमेल",
    emailPlaceholder: "अपना ईमेल लिखें",
    subject: "विषय",
    subjectPlaceholder: "विषय चुनें",
    message: "संदेश",
    messagePlaceholder: "अपना संदेश लिखें ...",
    submit: "संदेश भेजें",
    errorRequired: "कृपया सभी आवश्यक फ़ील्ड भरें।",
    errorEmail: "कृपया मान्य ईमेल पता लिखें।",
  },
  en: {
    heading: "Send a Message",
    name: "Name",
    namePlaceholder: "Enter your name",
    email: "Email",
    emailPlaceholder: "Enter your email",
    subject: "Subject",
    subjectPlaceholder: "Choose a subject",
    message: "Message",
    messagePlaceholder: "Write your message ...",
    submit: "Send Message",
    errorRequired: "Please fill in all required fields.",
    errorEmail: "Please enter a valid email address.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// There is no backend inbox for contact submissions today — the site's only
// real contact channel is the published email address. Composing a mailto:
// link from validated form input is genuinely functional (it hands the
// visitor's mail client a pre-filled message to send) rather than a form
// that silently does nothing, without inventing an API/database this
// project doesn't have.
export function ContactForm({ locale, contactEmail, subjectOptions }: ContactFormProps) {
  const c = COPY[locale];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(false);

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError(c.errorRequired);
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(c.errorEmail);
      return;
    }
    setError("");

    const body = `${message.trim()}\n\n—\n${c.name}: ${name.trim()}\n${c.email}: ${email.trim()}`;
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">{c.heading}</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-xs font-semibold text-foreground/80">
            {c.name} <span className="text-danger">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={c.namePlaceholder}
            required
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold text-foreground/80">
            {c.email} <span className="text-danger">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.emailPlaceholder}
            required
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div>
          <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold text-foreground/80">
            {c.subject} <span className="text-danger">*</span>
          </label>
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="" disabled>
              {c.subjectPlaceholder}
            </option>
            {subjectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold text-foreground/80">
            {c.message} <span className="text-danger">*</span>
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={c.messagePlaceholder}
            required
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {error && <p className="text-xs font-semibold text-danger">{error}</p>}
        {sent && !error && (
          <p className="text-xs font-semibold text-positive">
            {locale === "hi" ? "आपका ईमेल ऐप खुल गया है — भेजने के लिए वहां पुष्टि करें।" : "Your email app has opened — confirm sending there."}
          </p>
        )}

        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(234,88,12,0.45)] transition-colors hover:bg-orange-700"
        >
          <Send size={16} />
          {c.submit}
        </button>
      </form>
    </div>
  );
}
