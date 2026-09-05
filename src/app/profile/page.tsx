import ProfileClient from "@/components/profile/ProfileClient";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Edit Profile | Resumi",
  description: "Manage your public profile settings.",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  let dbUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!dbUser) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    dbUser = {
      id: userId,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      name: clerkUser.fullName || "",
      username: clerkUser.username || "",
      role: "",
      location: "",
      bio: "",
      website: "",
      social: "",
      github: "",
      createdAt: new Date(),
    };
  }

  return <ProfileClient initialData={dbUser} />;
}