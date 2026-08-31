import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Resumi - Smart Resume Builder",
  description: "Build ATS-optimized, professional resumes easily.",
  icons: {
    icon: "/icon/icons.png",
    apple: "/icon/icons.png", 
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
        <body className={`${jakarta.variable} ${lora.variable} font-sans text-slate-900 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}