// C:\resumi\src\app\page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingClient from "@/components/landing/LandingClient";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return <LandingClient />;
}