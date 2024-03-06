import { FavoritesTable } from "@/components/favorites-table";
import { NameGenerator } from "@/components/name-generator";
import { NameGeneratorShare } from "@/components/name-generator-share";
import { createClient } from "@/utils/supabase/server";

export default async function Names({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const idString = params.id;
  const idRegex = /.{36}/g;
  const idsList = idString.match(idRegex);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: names, error } = await supabase
    .from("names")
    .select()
    .in("id", idsList!);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4 text-center">Your Names</h1>
      <div className="flex">
        <NameGeneratorShare user={user} names={names}/>
      </div>
    </div>
  );
}
