import { redirect } from "next/navigation";

// Root page — redirect to dashboard (or login if unauthenticated)
export default function RootPage() {
  redirect("/dashboard");
}
