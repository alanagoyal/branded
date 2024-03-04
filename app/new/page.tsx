import { NameGenerator } from "@/components/name-generator";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function GenerateName() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4"></h1>
      <NameGenerator user={user} />
    </div>
  );
}
