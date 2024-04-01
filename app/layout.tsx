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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Namebase",
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
        <meta
          property="og:image"
          content="https://res.cloudinary.com/djp21wtxm/image/upload/v1712009452/i1600x839-BQQvTJy8t3Pk_grpcmh.png"
        />
        <meta
          property="twitter:image"
          content="https://res.cloudinary.com/djp21wtxm/image/upload/v1712009452/i1600x839-BQQvTJy8t3Pk_grpcmh.png"
        ></meta>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta
          property="twitter:description"
          content="Name your startup, secure the domain, and brand it—all in one place"
        ></meta>
        <meta
          property="twitter:title"
          content="Namebase"
        ></meta>

        <meta property="og:description" content="Name your startup, secure the domain, and brand it—all in one place" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
