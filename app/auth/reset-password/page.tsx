"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpAndResetPassword } from "@/lib/api-mock";
import { useToast } from "@/components/ui/toast";
import { FormField, inputClass, PrimaryButton } from "@/components/ui/shared";

function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const [form, setForm] = useState({
    email: emailFromQuery,
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required.";
    if (!form.otp.trim()) e.otp = "OTP is required.";
    if (form.newPassword.length < 8)
      e.newPassword = "Password must be at least 8 characters.";
    if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await verifyOtpAndResetPassword(form.email, form.otp, form.newPassword);
      toast({
        message: "Password reset successfully! Please sign in.",
        type: "success",
      });
      router.push("/auth/login");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not reset password. Please try again.";
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8">
      {/* DEV MODE banner */}
      <div className="mb-5 bg-amber-500/20 border border-amber-400/40 rounded-lg px-4 py-3 text-amber-200 text-xs">
        <strong>🛠 DEV MODE:</strong> No email provider is configured. In production, an OTP would
        be sent to your inbox. For testing, use OTP: <code className="font-mono bg-amber-500/20 px-1 rounded">123456</code>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6">Reset password</h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="reset-email" error={errors.email} required>
          <input
            id="reset-email"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }));
              setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="jane@company.com"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField label="One-Time Password (OTP)" htmlFor="reset-otp" error={errors.otp} required>
          <input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={form.otp}
            onChange={(e) => {
              setForm((p) => ({ ...p, otp: e.target.value }));
              setErrors((p) => ({ ...p, otp: "" }));
            }}
            placeholder="123456"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400 tracking-widest`}
          />
        </FormField>

        <FormField label="New Password" htmlFor="reset-new-password" error={errors.newPassword} required>
          <input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => {
              setForm((p) => ({ ...p, newPassword: e.target.value }));
              setErrors((p) => ({ ...p, newPassword: "" }));
            }}
            placeholder="Min. 8 characters"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField label="Confirm New Password" htmlFor="reset-confirm-password" error={errors.confirmPassword} required>
          <input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => {
              setForm((p) => ({ ...p, confirmPassword: e.target.value }));
              setErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            placeholder="Repeat your new password"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <PrimaryButton
          type="submit"
          loading={loading}
          className="w-full justify-center bg-indigo-500 hover:bg-indigo-400"
        >
          Reset password
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        <Link
          href="/auth/login"
          className="text-indigo-300 hover:text-indigo-200 font-medium"
        >
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    // useSearchParams() requires Suspense boundary
    <Suspense fallback={<div className="px-8 py-8 text-white/60 text-sm">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
