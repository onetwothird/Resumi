import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { internalError, validationError } from "@/lib/api-response";
import { userRoleSchema } from "@/lib/validation";

/**
 * Assigns the account role exactly once, during onboarding.
 *
 * The only caller is components/features/onboarding/OnboardingClient.tsx,
 * which src/proxy.ts reaches only when the session has no role yet
 * (proxy.ts:39-41). That makes "no role assigned" the precondition that
 * already gates this flow in the UI.
 *
 * The previous version had no precondition at all, so any authenticated
 * user could POST { role: "employer" } at any point in their life and
 * promote themselves. Since src/proxy.ts:49-55 trusts the session role as
 * the sole authorization check for /employer(.*), that reached
 * /employer/jobs/[id]/applicants, which exposes applicant resume data to
 * the person who posted the job.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = userRoleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const { role } = parsed.data;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // publicMetadata, not privateMetadata: the session claim is public so it
    // can live in the token the proxy reads.
    const currentRole = (user.publicMetadata as { role?: string } | undefined)?.role;
    if (currentRole && currentRole !== role) {
      return NextResponse.json(
        {
          error:
            "Your account role is already set and cannot be changed here. Contact support if this is wrong.",
        },
        { status: 403 }
      );
    }

    await client.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return NextResponse.json({ role });
  } catch (error) {
    return internalError("POST /api/user/role", error);
  }
}
