import { auth } from "@clerk/nextjs/server";
import CompaniesClient from "@/components/features/dashboard/CompaniesClient";
import PublicCompaniesClient from "@/components/features/dashboard/PublicCompaniesClient";

export const metadata = {
  title: "Companies | Resumi",
  description: "Browse companies that are hiring on Resumi.",
};

export default async function CompaniesPage() {
  const { userId } = await auth();

  if (userId) {
    return <CompaniesClient />;
  }

  return <PublicCompaniesClient />;
}
