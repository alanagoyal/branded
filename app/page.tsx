/**
 * v0 by Vercel.
 * @see https://v0.dev/t/RYcnF4FO222
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();

  return (
    <div className="w-full pt-10 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl font-extrabold leading-tight">
          Transform your idea into a{" "}
          <span style={{ color: "#C850C0" }}>billion-dollar brand</span>
        </h1>
        <p className="mt-4 max-w-2xl text-xl">
          Namebase helps founders name their startup, secure the domain, and
          brand it - all in one place.
        </p>
        <div className="flex pt-4">
          <Link href="/new">
            <Button
              className="mt-4 text-lg"
              style={{
                background:
                  "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
                padding: "2px 30px",
              }}
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex justify-around items-center mt-20">
        <div className="w-1/3 p-4 shadow-lg rounded-lg">
          <h2 className="text-xl font-bold">Startup Names</h2>
          <p className="mt-2">Go from idea to startup name in one click.</p>
        </div>
        <div className="w-1/3 p-4  shadow-lg rounded-lg mx-4">
          <h2 className="text-xl font-bold">Domain Names</h2>
          <p className="mt-2">
            Secure the perfect domain name for your startup.
          </p>
        </div>
        <div className="w-1/3 p-4 shadow-lg rounded-lg">
          <h2 className="text-xl font-bold">Branded Content</h2>
          <p className="mt-2">
            Generate custom branded content for your startup.
          </p>
        </div>
      </div>
    </div>
  );
}
