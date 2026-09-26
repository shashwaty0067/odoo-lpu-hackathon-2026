"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { FormField, inputClass, PrimaryButton } from "@/components/ui/shared";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required.";
    if (!form.password) e.password = "Password is required.";
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
      // In the real app: await signIn("credentials", { email, password, redirect: false })
      // For now, simulate a successful login
      await new Promise((r) => setTimeout(r, 800));
      toast({ message: "Welcome back!", type: "success" });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password.";
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8">
      <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="login-email" error={errors.email} required>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }));
              setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="jane@company.com"
            className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" error={errors.password} required>
          <div className="relative">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => {
                setForm((p) => ({ ...p, password: e.target.value }));
                setErrors((p) => ({ ...p, password: "" }));
              }}
              placeholder="Your password"
              className={`${inputClass} bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-indigo-400`}
            />
          </div>
        </FormField>

        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-indigo-300 hover:text-indigo-200"
          >
            Forgot password?
          </Link>
        </div>

        <PrimaryButton
          type="submit"
          loading={loading}
          className="w-full justify-center bg-indigo-500 hover:bg-indigo-400"
        >
          Sign in
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-indigo-300 hover:text-indigo-200 font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
