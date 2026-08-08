import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resumi - Smart Resume Builder",
  description: "Build ATS-optimized, professional resumes easily.",
  // Explicitly linking the icon from the public folder
  icons: {
    icon: "/icon/icons.png",
    apple: "/icon/icons.png", // Optional but good for iOS devices
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{ 
        variables: {
          colorBackground: '#ffffff', 
          colorPrimary: '#4f46e5',    
          colorForeground: '#0f172a', 
        }
      }}
    >
      <html lang="en">
        <body className={`${inter.className} bg-[#F7F9FC] text-slate-900 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}