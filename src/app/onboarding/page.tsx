import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role as "employer" | "jobseeker" | undefined;

  if (role === "employer") redirect("/employer/dashboard");
  if (role === "jobseeker") redirect("/dashboard");

  return <OnboardingClient />;
}