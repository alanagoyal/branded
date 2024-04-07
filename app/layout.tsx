import type { Metadata } from "next";
import "@/styles/globals.css";

import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import SiteFooter from "@/components/site-footer";
import { CommandMenu } from "@/components/command-menu";
import { createClient } from "@/utils/supabase/server";
import { Analytics } from "@vercel/analytics/react"


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Branded",
  description: "AI-generated names for your next project",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta
          property="twitter:description"
          content="Name your startup, secure the domain, and brand it—all in one place"
        ></meta>
        <meta
          property="twitter:image"
          content="https://res.cloudinary.com/djp21wtxm/image/upload/v1712522493/i1600x839-5mfxeBHBHdKf_nj5zzr.png"
        ></meta>
        <meta property="og:title" content="Branded"></meta>
        <meta
          property="og:description"
          content="Name your startup, secure the domain, and brand it—all in one place"
        ></meta>
        <meta
          property="og:image"
          content="https://res.cloudinary.com/djp21wtxm/image/upload/v1712522493/i1600x839-5mfxeBHBHdKf_nj5zzr.png"
        />
        <meta property="og:url" content="https://branded.ai"></meta>
        <meta name='impact-site-verification' content='69669d07-f4c4-4ab2-9530-33933551cc53'></meta>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div vaul-drawer-wrapper="">
            <div className="relative flex flex-col bg-background">
              <SiteHeader />
              {user && <CommandMenu />}
              <main className="flex-1">
                <div className="flex flex-col items-center pt-10 py-2 max-w-5xl mx-auto">
                  {children}
                  <Analytics />
                </div>
              </main>
              <SiteFooter />
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
