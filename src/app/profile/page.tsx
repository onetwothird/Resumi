import ProfileClient from "@/components/features/profile/ProfileClient";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensure-user";

export const metadata = {
  title: "Edit Profile | Resumi",
  description: "Manage your public profile settings.",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Guarantee the user exists in our DB (creates from Clerk data if needed)
  const dbUser = await ensureUser(userId);

  if (!dbUser) {
    redirect("/sign-in");
  }

  return <ProfileClient initialData={dbUser} />;
}