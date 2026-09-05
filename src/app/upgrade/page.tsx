import UpgradeClient from "@/components/profile/UpgradeClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "VIP Plan | Resumi",
};

export default async function UpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <UpgradeClient />;
}