// C:\resumi\src\app\page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingClient from "@/components/landing/LandingClient";

export default async function LandingPage() {
  const { userId } = await auth();

  // If the user is already logged in, send them straight to the dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Otherwise, render the animated landing page
  return <LandingClient />;
}