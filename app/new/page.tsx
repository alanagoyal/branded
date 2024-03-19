import { NameGenerator } from "@/components/name-generator";
import { createClient } from "@/utils/supabase/server";

export default async function GenerateName() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="w-full px-4">
      <h1 className="text-2xl font-bold mb-4">Name Generator</h1>
      <NameGenerator user={user} names={null} />
    </div>
  );
}
