import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Role = "employer" | "jobseeker";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/companies(.*)",
  "/jobs(.*)",
  "/pricing(.*)",
  "/for-employers(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
const isEmployerRoute = createRouteMatcher(["/employer(.*)"]);
const isJobSeekerRoute = createRouteMatcher(["/dashboard(.*)", "/resume(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    if (isApiRoute(req)) {
      return NextResponse.next();
    }

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn();
    }

    const role = (sessionClaims?.metadata as { role?: Role } | undefined)?.role;

    // Onboarding gate is intentionally NOT enforced here.
    // sessionClaims.role can lag behind Clerk's actual publicMetadata
    // right after a role is chosen (JWT refresh delay), which caused
    // an infinite redirect loop with the onboarding/dashboard pages
    // that check the live value via clerkClient().users.getUser().
    // Each page (/onboarding, /dashboard, /employer/dashboard) already
    // does its own live role check and redirect — that's the source of truth.

    if (role === "employer" && isJobSeekerRoute(req)) {
      return NextResponse.redirect(new URL("/employer/dashboard", req.url));
    }

    if (role === "jobseeker" && isEmployerRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};