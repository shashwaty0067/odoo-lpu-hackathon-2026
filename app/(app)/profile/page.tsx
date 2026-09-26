"use client";

// ============================================================
// Profile page
// View/edit name + email; change password form; logout button
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword } from "@/lib/api-mock";
import {
  PageHeader, FormField, inputClass, PrimaryButton,
} from "@/components/ui/shared";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

// Mock profile — in real app this comes from useSession()
const MOCK_PROFILE = {
  name: "Demo User",
  email: "demo@stocksense.app",
  role: "Admin",
};

// ---- Edit profile form ----
function EditProfileForm() {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: MOCK_PROFILE.name, email: MOCK_PROFILE.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required.";
    return e;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      toast({ message: "Profile updated!", type: "success" });
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            id="edit-profile-button"
          >
            Edit
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {form.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{form.name}</p>
              <p className="text-sm text-slate-500">{form.email}</p>
              <span className="inline-flex items-center mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {MOCK_PROFILE.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-5">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Edit Profile</h2>
      </div>
      <form onSubmit={handleSave} noValidate className="p-5 space-y-4">
        <FormField label="Full Name" htmlFor="profile-name" error={errors.name} required>
          <input
            id="profile-name"
            type="text"
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: "" })); }}
            className={inputClass}
          />
        </FormField>
        <FormField label="Email" htmlFor="profile-email" error={errors.email} required>
          <input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: "" })); }}
            className={inputClass}
          />
        </FormField>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => { setEditing(false); setErrors({}); }}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" loading={loading}>Save changes</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

// ---- Change password form ----
function ChangePasswordForm() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.current) e.current = "Current password is required.";
    if (form.newPass.length < 8) e.newPass = "New password must be ≥ 8 characters.";
    if (form.newPass !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.newPass });
      toast({ message: "Password changed successfully!", type: "success" });
      setForm({ current: "", newPass: "", confirm: "" });
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      toast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-5">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your account password.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            id="change-password-button"
          >
            Change password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-5">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
        <FormField label="Current Password" htmlFor="pwd-current" error={errors.current} required>
          <input
            id="pwd-current"
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={(e) => { setForm((p) => ({ ...p, current: e.target.value })); setErrors((p) => ({ ...p, current: "" })); }}
            className={inputClass}
          />
        </FormField>
        <FormField label="New Password" htmlFor="pwd-new" error={errors.newPass} required>
          <input
            id="pwd-new"
            type="password"
            autoComplete="new-password"
            value={form.newPass}
            onChange={(e) => { setForm((p) => ({ ...p, newPass: e.target.value })); setErrors((p) => ({ ...p, newPass: "" })); }}
            placeholder="Min. 8 characters"
            className={inputClass}
          />
        </FormField>
        <FormField label="Confirm New Password" htmlFor="pwd-confirm" error={errors.confirm} required>
          <input
            id="pwd-confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => { setForm((p) => ({ ...p, confirm: e.target.value })); setErrors((p) => ({ ...p, confirm: "" })); }}
            className={inputClass}
          />
        </FormField>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => { setOpen(false); setErrors({}); setForm({ current: "", newPass: "", confirm: "" }); }}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={loading}>Update password</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

// ---- Main profile page ----
export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showLogout, setShowLogout] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);
    // In real app: await signOut({ callbackUrl: "/auth/login" })
    await new Promise((r) => setTimeout(r, 500));
    toast({ message: "Signed out successfully.", type: "info" });
    router.push("/auth/login");
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="My Profile" description="Manage your account details and password." />

      <EditProfileForm />
      <ChangePasswordForm />

      {/* Logout */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-slate-900 mb-1">Sign out</h2>
          <p className="text-xs text-slate-500 mb-3">
            You will be redirected to the login page.
          </p>
          <button
            onClick={() => setShowLogout(true)}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
            id="logout-button"
          >
            🚪 Sign out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Sign out?"
        description={<p>Are you sure you want to sign out of StockSense?</p>}
        confirmLabel="Sign out"
        variant="danger"
        loading={logoutLoading}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
