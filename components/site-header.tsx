import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import UserNav from "./user-nav";
import { Button } from "@/components/ui/button";
import Wordmark from "./wordmark";

export async function SiteHeader() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Wordmark />
          <div className="flex items-center mx-1">
            <div className="items-center space-x-2">
              <Link
                href="https://github.com/alanagoyal/namebase"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-block" 
              >
                <Button variant="ghost">View on GitHub</Button>
              </Link>
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
