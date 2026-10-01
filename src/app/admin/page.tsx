import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminClient from "@/components/features/admin/AdminClient";
import { getAdminStats } from "@/lib/admin-stats";

export const metadata = {
  title: "Admin | Resumi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The admin landing page.
 *
 * Gated on the same `publicMetadata.isAdmin` claim that src/proxy.ts and every
 * /api/admin route check, read from the session token rather than from the
 * database. All three layers are deliberate:
 *
 *   - the proxy refuses to route a non-admin to /admin at all
 *   - this page redirects, so a stale tab or a hand-typed URL still bounces
 *   - every API route re-checks, because src/proxy.ts deliberately does not
 *     gate /api(.*) and a page-level check protects nothing on its own
 *
 * The redirect target is the role's home rather than /sign-in: the visitor is
 * already signed in, and sending them to sign-in would look like a session
 * problem instead of a permissions one.
 */
export default async function AdminPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const metadata = sessionClaims?.metadata as
    | { isAdmin?: unknown; role?: string }
    | undefined;

  if (metadata?.isAdmin !== true) {
    redirect(metadata?.role === "employer" ? "/employer/dashboard" : "/dashboard");
  }

  // Fetched here so the panel paints with real numbers on first load instead of
  // a skeleton and then a second round-trip. The client refetches after each
  // write, so this is the initial value, not the only read.
  const stats = await getAdminStats();

  return <AdminClient initialStats={stats} />;
}
