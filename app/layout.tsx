import type { Metadata } from "next";
import "@/styles/globals.css";

import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Namebase",
  description: "AI-generated names for your next project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.variable}`}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {" "}
          <SiteHeader />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
