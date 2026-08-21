import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Role = "employer" | "jobseeker";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isEmployerRoute = createRouteMatcher(["/employer(.*)"]);
const isJobSeekerRoute = createRouteMatcher(["/dashboard(.*)", "/resume(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};