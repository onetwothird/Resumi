import CandidatesClient from "@/components/features/employer/CandidatesClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export const metadata = { title: "Candidates | Employer Portal" };

export default async function CandidatesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <CandidatesClient />;
}