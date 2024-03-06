import { FavoritesTable } from "@/components/favorites-table";
import { NameGenerator } from "@/components/name-generator";
import { createClient } from "@/utils/supabase/server";

export default async function Names({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const idString = params.id;
  const idRegex = /.{36}/g;
  const idsList = idString.match(idRegex);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const names: string[] = []
  if (idsList) {
    for (const id of idsList) {
        let { data, error } = await supabase.from("names").select().eq("id", id).single()
        if (error) throw error
        if (data) {
            names.push(data?.name)
        }
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4 text-center">Your Names</h1>
      <div className="flex">
      </div>
    </div>
  );
}
