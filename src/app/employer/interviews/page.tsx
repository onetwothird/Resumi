import InterviewsClient from "@/components/features/employer/InterviewsClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Interviews | Employer Portal" };

export default async function InterviewsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <InterviewsClient />;
}