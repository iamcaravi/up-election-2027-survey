"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Feedback = { kind: "success" | "error"; message: string } | null;

export function AccountSettingsForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  async function submitEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailFeedback(null);
    try {
      const res = await fetch("/api/admin/account/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to update email.");
      }
      setEmail(body.email);
      setNewEmail("");
      setEmailPassword("");
      setEmailFeedback({ kind: "success", message: "Login email updated." });
      router.refresh();
    } catch (err) {
      setEmailFeedback({ kind: "error", message: err instanceof Error ? err.message : "Failed to update email." });
    } finally {
      setEmailSaving(false);
    }
  }

  async function submitPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordFeedback(null);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ kind: "success", message: "Password updated." });
    } catch (err) {
      setPasswordFeedback({ kind: "error", message: err instanceof Error ? err.message : "Failed to update password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Login email</h2>
        <p className="mt-1 text-sm text-muted">
          Current login email: <span className="font-semibold text-foreground">{email}</span>
        </p>

        <form onSubmit={submitEmailChange} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              placeholder="new-email@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current password</label>
            <input
              type="password"
              required
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              autoComplete="current-password"
            />
            <p className="mt-1 text-xs text-muted">Required to confirm it&apos;s really you before changing the login email.</p>
          </div>

          {emailFeedback && (
            <p className={`text-sm font-medium ${emailFeedback.kind === "success" ? "text-green-600 dark:text-green-400" : "text-danger"}`}>
              {emailFeedback.message}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={emailSaving}>
            {emailSaving ? "Saving…" : "Update email"}
          </Button>
        </form>
      </div>

      <div className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Password</h2>
        <p className="mt-1 text-sm text-muted">Your current password is never shown. Enter a new one to change it.</p>

        <form onSubmit={submitPasswordChange} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              autoComplete="new-password"
            />
          </div>

          {passwordFeedback && (
            <p className={`text-sm font-medium ${passwordFeedback.kind === "success" ? "text-green-600 dark:text-green-400" : "text-danger"}`}>
              {passwordFeedback.message}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={passwordSaving}>
            {passwordSaving ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
