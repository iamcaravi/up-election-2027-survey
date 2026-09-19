"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No reset token was provided. Please use the link provided in your email.");
      setCheckingToken(false);
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/admin/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setTokenError(data.error ?? "This password reset link is invalid or has expired.");
        }
      } catch {
        setTokenError("Unable to verify reset link. Please check your connection.");
      } finally {
        setCheckingToken(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to reset password. The link may have expired.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login?reset=success");
      }, 2000);
    } catch {
      setError("A network error occurred. Please try again.");
      setSubmitting(false);
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
            Admin Portal &bull; Set New Password
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Strong Security</p>
                <p className="text-xs text-white/70">Passwords are securely hashed with bcrypt</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/70">
              Choose a strong password containing at least 8 characters. After resetting, your old password will be completely invalidated.
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
            {checkingToken ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-ink border-r-transparent align-[-0.125em]" />
                <p className="mt-4 text-sm text-muted">Verifying reset token...</p>
              </div>
            ) : tokenError ? (
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink">Invalid or Expired Link</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{tokenError}</p>
                </div>

                <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted space-y-1">
                  <p>Reset links are single-use and expire after 45 minutes.</p>
                  <p>If you need to reset your password, please submit a new request.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Link href="/admin/forgot-password">
                    <Button variant="primary" className="w-full justify-center">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <Link href="/admin/login">
                    <Button variant="outline" className="w-full justify-center">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink">Password Updated</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Your password has been reset successfully. Redirecting you to login...
                  </p>
                </div>

                <div className="pt-2">
                  <Link href="/admin/login?reset=success">
                    <Button variant="primary" className="w-full justify-center">
                      Go to Admin Login Now
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/10 text-ink dark:bg-white/10 dark:text-white mb-5">
                  <KeyRound size={24} />
                </div>

                <h2 className="font-display text-3xl font-extrabold text-ink">Set New Password</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Create a new password for your administrator account.
                </p>

                <div className="mt-7 space-y-4">
                  <div>
                    <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
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
                  disabled={submitting}
                >
                  {submitting ? "Updating Password..." : "Reset Password"} {!submitting && <ArrowRight size={18} />}
                </Button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
