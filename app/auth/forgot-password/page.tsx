"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestPasswordResetOtp } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { FormField, inputClass, PrimaryButton } from "@/components/ui/shared";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordResetOtp(email);
      toast({
        message: "OTP request sent! Check your inbox (or use 123456 in dev mode).",
        type: "success",
      });
      // Pass email via query param for the reset page to use
      router.push(
        `/auth/reset-password?email=${encodeURIComponent(email)}`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not send OTP. Please try again.";
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8">
      <h2 className="text-xl font-semibold text-white mb-2">Forgot password</h2>
      <p className="text-sm text-white/60 mb-6">
        Enter your email and we&apos;ll send you a one-time password.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="forgot-email" error={error} required>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="jane@company.com"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <PrimaryButton
          type="submit"
          loading={loading}
          className="w-full justify-center bg-indigo-500 hover:bg-indigo-400"
        >
          Send OTP
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="text-indigo-300 hover:text-indigo-200 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
