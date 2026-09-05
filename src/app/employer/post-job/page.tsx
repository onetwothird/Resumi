import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PostJobForm from "@/components/features/employer/PostJobForm";

export default async function PostJobPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const role = clerkUser.publicMetadata?.role as "employer" | "jobseeker" | undefined;

  if (role === "jobseeker") redirect("/dashboard");
  if (role !== "employer") redirect("/onboarding");

  return <PostJobForm />;
}