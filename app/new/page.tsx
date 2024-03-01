import { NameGenerator } from "@/components/name-generator";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function GenerateName() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <NameGenerator user={user} />
    </main>
  );
}
