"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { FormField, inputClass, PrimaryButton } from "@/components/ui/shared";

// Client-side validation helpers
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return password.length >= 8;
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!validateEmail(form.email)) e.email = "Please enter a valid email address.";
    if (!validatePassword(form.password))
      e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
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
      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast({ message: "Account created! Please sign in.", type: "success" });
      router.push("/auth/login");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not create account. Please try again.";
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  return (
    <div className="px-8 py-8">
      <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full Name" htmlFor="signup-name" error={errors.name} required>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            placeholder="Jane Smith"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField label="Email" htmlFor="signup-email" error={errors.email} required>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => field("email", e.target.value)}
            placeholder="jane@company.com"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField label="Password" htmlFor="signup-password" error={errors.password} required>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => field("password", e.target.value)}
            placeholder="Min. 8 characters"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="signup-confirm-password"
          error={errors.confirmPassword}
          required
        >
          <input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => field("confirmPassword", e.target.value)}
            placeholder="Repeat your password"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        {/* Submit is disabled while a request is in flight to prevent double-submit */}
        <PrimaryButton
          type="submit"
          loading={loading}
          className="w-full justify-center bg-indigo-500 hover:bg-indigo-400 mt-2"
        >
          Create account
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        Already have an account?{" "}
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
