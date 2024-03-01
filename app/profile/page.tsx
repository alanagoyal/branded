import ProfileForm from "@/components/profile-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Account() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: userData, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", user?.id)
    .single();

  return (
    <div className="flex flex-col items-center min-h-screen pt-20 py-2">
      <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
      <ProfileForm user={user} userData={userData} />
    </div>
  );
}
