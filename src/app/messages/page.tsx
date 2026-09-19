import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MessagesClient from "@/components/features/messages/MessagesClient";

export const metadata = {
  title: "Messages | Resumi",
};

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <MessagesClient />;
}