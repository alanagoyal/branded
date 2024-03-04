import { FavoritesTable } from "@/components/favorites-table";
import { createClient } from "@/utils/supabase/server";

export default async function Favorites() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: names, error } = await supabase
    .from("names")
    .select()
    .eq("created_by", user?.id)
    .eq("favorited", true);
  return (
    <div className="flex flex-col items-center min-h-screen pt-20 py-2">
      <h1 className="text-4xl font-bold mb-4">Your Names</h1>
      <div className="flex">
        <FavoritesTable favorites={names} />
      </div>
    </div>
  );
}
