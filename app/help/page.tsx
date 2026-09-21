import { CaseChat } from "@/components/case-chat";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HelpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full px-4 flex justify-center items-center flex-col">
      <div className="w-full min-h-screen">
        <div className="mb-6 rounded-md border p-4 text-sm space-y-2">
          <p>To delete your account, open <Link href="/account" className="underline">Account</Link> and choose Delete account.</p>
          <p>For help, email <a href="mailto:hi@basecase.vc" className="underline">hi@basecase.vc</a>.</p>
        </div>
        <CaseChat user={user} />
      </div>
    </div>
  );
}
