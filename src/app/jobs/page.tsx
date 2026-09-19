import { auth } from "@clerk/nextjs/server";
import JobsClient from "@/components/features/dashboard/JobsClient";

export const metadata = {
  title: "Browse Jobs | Resumi",
  description: "Browse open roles from companies actively hiring on Resumi.",
};

export default async function JobsPage() {
  const { userId } = await auth();

  return <JobsClient isLoggedIn={!!userId} />;
}
