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
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isEmployerRoute = createRouteMatcher(["/employer(.*)"]);
const isJobSeekerRoute = createRouteMatcher(["/dashboard(.*)", "/resume(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

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

    if (!role && !isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    if (role && isOnboardingRoute(req)) {
      return NextResponse.redirect(
        new URL(role === "employer" ? "/employer/dashboard" : "/dashboard", req.url)
      );
    }

    if (role === "employer" && isJobSeekerRoute(req)) {
      return NextResponse.redirect(new URL("/employer/dashboard", req.url));
    }

    if (role === "jobseeker" && isEmployerRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // /admin is reachable by admins of either role, so this check sits after the
    // cross-role redirects rather than inside one of them: an admin who is also
    // a jobseeker still needs /admin to be theirs, not bounced to /dashboard.
    //
    // This is a routing convenience, not the authorization. src/proxy.ts
    // short-circuits /api(.*) above, so none of the /api/admin routes are
    // protected here — each one calls requireAdmin() itself, and the admin page
    // re-checks before rendering. A non-admin who types /admin gets redirected
    // to their own home rather than a 404, which tells them the page exists and
    // is simply not for them.
    const isAdmin = (sessionClaims?.metadata as { isAdmin?: unknown } | undefined)
      ?.isAdmin === true;

    if (isAdminRoute(req) && !isAdmin) {
      return NextResponse.redirect(
        new URL(role === "employer" ? "/employer/dashboard" : "/dashboard", req.url)
      );
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