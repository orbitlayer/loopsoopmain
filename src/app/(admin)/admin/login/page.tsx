import { hasDbEnv } from "@/lib/db";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  // With no database configured, offer a demo entry so the browser-storage CMS
  // is usable before hosting is set up.
  return <LoginForm demo={!hasDbEnv()} />;
}
