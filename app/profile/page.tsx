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
    <div className="w-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <ProfileForm user={user} userData={userData} />
    </div>
  );
}
