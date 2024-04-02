import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import UserNav from "./user-nav";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/wordmark_light.png"
                alt="namebase"
                width={196}
                height={64}
                priority
              />
            </Link>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:flex">
              <ThemeToggle />
            </div>
            <div className="items-center">
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
      </div>
    </nav>
  );
}
