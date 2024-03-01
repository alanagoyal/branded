import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

import UserNav from "./user-nav";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="-ml-2 mr-6 flex items-center">
              <Link href="/">
                <span className="text-2xl font-bold">namebase</span>
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center">
            <Link
              href="https://github.com/alanagoyal/namebase"
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={buttonVariants({
                  size: "sm",
                  variant: "ghost",
                })}
              >
                <Icons.gitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </div>
            </Link>
            <ThemeToggle />
            {user ? (
              <UserNav user={user} />
            ) : (
              <Link href="login">
                <Button className="ml-4">Log In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
