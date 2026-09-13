"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, BarChart3, Eye, EyeOff, Quote, ShieldCheck, Users2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  { icon: BarChart3, title: "Real Public Opinion", body: "Constituency-wise insights" },
  { icon: ShieldCheck, title: "Secure & Private", body: "Your data, your privacy" },
  { icon: Users2, title: "Better Governance", body: "People's voice for a better tomorrow" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero panel — reuses the existing survey hero photo, never a new/generated image. */}
      <div className="relative flex h-[60vh] shrink-0 flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-white sm:px-12 sm:py-10 lg:h-auto lg:w-1/2">
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
              <span className="h-4 w-1.5 rounded-sm bg-accent" />
              <span className="h-6 w-1.5 rounded-sm bg-positive" />
              <span className="h-3.5 w-1.5 rounded-sm bg-white" />
            </span>
            <span className="font-display text-lg font-extrabold lowercase">votersurvey.in</span>
          </div>

          <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Data-Driven
            <br />
            Democracy
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/80">
            A transparent platform for a stronger, more informed India.
          </p>

          <div className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <f.icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="text-xs text-white/70">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl bg-black/30 p-4 backdrop-blur-sm">
          <Quote size={18} className="text-white/50" />
          <p className="mt-1 text-sm font-medium leading-snug">
            &quot;A more informed voter
            <br />
            builds a stronger nation.&quot;
          </p>
          <div className="mt-3 flex h-1 w-32 overflow-hidden rounded-full">
            <span className="w-1/3 bg-orange-500" />
            <span className="w-1/3 bg-white" />
            <span className="w-1/3 bg-green-600" />
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-end px-6 pt-6 sm:px-10">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={15} /> Back to Website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h2 className="font-display text-3xl font-extrabold text-ink">Admin Login</h2>
            <p className="mt-1 text-sm text-muted">Access your votersurvey.in admin dashboard</p>

            <div className="mt-7 space-y-4">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@votersurvey.in"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Keep me logged in
              </label>
              <Link href="/admin/account" className="font-semibold text-blue-700 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

            <Button type="submit" variant="primary" size="lg" className="mt-6 w-full justify-center gap-2" disabled={loading}>
              {loading ? "Signing in..." : "Login"} {!loading && <ArrowRight size={18} />}
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink">
                <ShieldCheck size={17} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Authorized Access Only</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  This is a secured area for administrators. Unauthorized access is prohibited.
                </p>
              </div>
            </div>
          </form>
        </div>

        <footer className="border-t border-border px-6 py-5 text-center sm:px-10">
          <p className="font-display text-sm font-extrabold lowercase text-ink">votersurvey.in</p>
          <p className="text-xs text-muted">जनता की राय, बेहतर कल के लिए</p>
          <p className="mt-2 text-xs text-muted">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link> {" | "}
            <Link href="/terms" className="hover:underline">Terms of Use</Link> {" | "}
            <Link href="/contact" className="hover:underline">Support</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
