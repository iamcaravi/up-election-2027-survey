"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to request password reset. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Visual Brand Panel */}
      <div className="relative flex h-[40vh] shrink-0 flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-white sm:px-12 sm:py-10 lg:h-auto lg:w-1/2">
        <Image
          src="/images/survey/voter-survey-hero-2.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="-z-10 object-cover opacity-90"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/95 via-ink/70 to-ink/95" aria-hidden="true" />

        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-end gap-1">
              <span className="h-6 w-1.5 rounded-full bg-orange-500" />
              <span className="h-4 w-1.5 rounded-full bg-white" />
              <span className="h-8 w-1.5 rounded-full bg-green-500" />
            </span>
            <span className="font-display text-xl font-black tracking-tight text-white">
              Voter<span className="text-orange-400">Survey</span>.in
            </span>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/70">
            Admin Portal &bull; Account Recovery
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Secure Password Reset</p>
                <p className="text-xs text-white/70">Single-use encrypted tokens with timed expiration</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/70">
              For security, recovery links are cryptographically hashed and automatically expire within 45 minutes of generation.
            </p>
          </div>
        </div>

        <div className="text-xs text-white/60">
          <span>&copy; {new Date().getFullYear()} votersurvey.in. Authorized staff only.</span>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between items-center px-6 pt-6 sm:px-10">
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
          >
            <ArrowLeft size={15} /> Back to Login
          </Link>
          <Link href="/" className="text-xs font-medium text-muted hover:underline">
            Main Site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            {submitted ? (
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink">Check Your Email</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    If an account exists for <strong className="text-foreground">{email}</strong>, a password reset link has been sent.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted space-y-2">
                  <p className="font-semibold text-foreground">Next steps:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Check your inbox and spam/junk folder.</li>
                    <li>The reset link will expire in <strong>45 minutes</strong>.</li>
                    <li>If you don&apos;t receive an email, please verify the address or contact a system administrator.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link href="/admin/login">
                    <Button variant="outline" className="w-full justify-center">
                      Return to Admin Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 mb-5">
                  <Mail size={24} />
                </div>

                <h2 className="font-display text-3xl font-extrabold text-ink">Forgot Password?</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Enter your registered administrator email address and we will send you a password reset link.
                </p>

                <div className="mt-7 space-y-4">
                  <div>
                    <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-foreground">
                      Admin Email Address
                    </label>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@votersurvey.in"
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-6 w-full justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? "Sending Link..." : "Send Reset Link"} {!loading && <ArrowRight size={18} />}
                </Button>

                <div className="mt-6 text-center">
                  <Link
                    href="/admin/login"
                    className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Remember your password? Log in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer className="border-t border-border px-6 py-5 text-center sm:px-10">
          <p className="font-display text-sm font-extrabold lowercase text-ink">votersurvey.in</p>
          <p className="text-xs text-muted">जनता की राय, बेहतर कल के लिए</p>
        </footer>
      </div>
    </div>
  );
}
