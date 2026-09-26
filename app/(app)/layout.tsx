import { AppShell } from "@/components/layout/app-shell";

// Layout for all authenticated app routes (dashboard, products, etc.)
// Wraps children with sidebar + topbar via the AppShell client component.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
