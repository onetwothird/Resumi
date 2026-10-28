import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SettingsClient from "@/components/features/settings/SettingsClient";
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from "@/lib/notification-settings";

export const metadata = {
  title: "Settings | Resumi",
};

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      role: true,
      location: true,
      bio: true,
      website: true,
      social: true,
      github: true,
      settings: true,
    },
  });

  const initialData = {
    name: user?.name ?? null,
    username: user?.username ?? null,
    role: user?.role ?? null,
    location: user?.location ?? null,
    bio: user?.bio ?? null,
    website: user?.website ?? null,
    social: user?.social ?? null,
    github: user?.github ?? null,
  };

  // Read here rather than fetched after mount, so the switches render with
  // their saved state instead of a "Loading preferences..." spinner.
  const initialSettings: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(typeof user?.settings === "object" && user.settings !== null && !Array.isArray(user.settings)
      ? (user.settings as Partial<NotificationSettings>)
      : {}),
  };

  return <SettingsClient initialData={initialData} initialSettings={initialSettings} />;
}