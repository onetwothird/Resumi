import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/features/notifications/NotificationsClient";

export const metadata = {
  title: "Notifications | Resumi",
};

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <NotificationsClient />;
}