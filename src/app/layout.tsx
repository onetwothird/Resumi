import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes"; // 1. Import the dark theme

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resumi- AI Resume Builder",
  description: "Build ATS-friendly resumes in minutes using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. Add the appearance prop to ClerkProvider
    <ClerkProvider appearance={{ theme: dark }}>
      <html lang="en">
        <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}