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
          <footer className="text-center py-8">
            {" "}
            <div className="text-center mb-2">
              <p>
                Built with <span className="text-red-500">❤️</span> by{" "}
                <a
                  href="https://twitter.com/alanaagoyal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Alana Goyal
                </a>{" "}
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
