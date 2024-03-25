import { CaseChat } from "@/components/case-chat";
import { createClient } from "@/utils/supabase/server";

export default async function HelpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="w-full px-4 flex justify-center items-center flex-col">
      <div className="w-full min-h-screen">
        <CaseChat user={user} />{" "}
      </div>
    </div>
  );
}
