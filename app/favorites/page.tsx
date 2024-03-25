import { FavoritesTable } from "@/components/favorites-table";
import { NamesTable } from "@/components/names-table";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Favorites() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: names } = await supabase
    .from("names")
    .select()
    .eq("created_by", user?.id)
    .eq("favorited", true);

  const namesList: { [name: string]: string } = {};

  if (names) {
    for (const name of names) {
      namesList[name.name] = name.id;
    }
  }

  return (
    <div className="w-full px-4 flex justify-center items-center flex-col">
      <h1 className="text-2xl font-bold mb-4">Favorites</h1>
      <div className="min-h-screen">
        {namesList && Object.keys(namesList).length > 0 ? (
          <NamesTable namesList={namesList} user={user} />
        ) : (
          <p className="text-sm pt-10">You haven't favorited any names yet</p>
        )}
      </div>
    </div>
  );
}
