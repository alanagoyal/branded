import { createClient } from "@/utils/supabase/server";
import NewGeneration from "@/components/new-generation";

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
    <div className="w-full px-4">
      <NewGeneration user={user} names={names} />
    </div>
  );
}
