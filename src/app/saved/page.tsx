import SavedClient from "@/components/profile/SavedClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Bookmarks | Resumi",
};

export default async function SavedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <SavedClient />;
  
}