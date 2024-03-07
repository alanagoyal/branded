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
    <div className="w-full px-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Favorites</h1>
        <div className="flex">
          <FavoritesTable favorites={names} />
        </div>
      </div>
  );
}
