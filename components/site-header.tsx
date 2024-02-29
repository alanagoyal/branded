import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

import UserNav from "./user-nav";
import { createClient } from "@/utils/supabase/server";

export async function SiteHeader() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);

  return (
    <nav className="border-b border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="-ml-2 mr-6 flex items-center">
              <span className="text-2xl font-bold">namebase</span>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center">
            <Link href="www.github.com" target="_blank" rel="noreferrer">
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
            {user ? (
              <UserNav user={user} />
            ) : (
              <Link href="login">
                <Button className="ml-4 ">Log In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
  /* return (
    <div>
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <Link href="/">
                <div>namebase</div>
              </Link>
              <Link href="www.github.com" target="_blank" rel="noreferrer">
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
              {user && <UserNav user={user} />}
            </nav>
          </div>
        </div>
      </header>
    </div>
  ); */
}
