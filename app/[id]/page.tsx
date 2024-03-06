import { FavoritesTable } from "@/components/favorites-table";
import { createClient } from "@/utils/supabase/server";

export default async function Names({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;
  console.log(id)
  const decodedIdString = decodeURIComponent(id);
  const ids = decodedIdString.split(',');
  console.log(ids)

  const {
    data: { user },
  } = await supabase.auth.getUser();


  return (
    <div>
      <h1 className="text-4xl font-bold mb-4 text-center">Your Names</h1>
      <div className="flex">
      </div>
    </div>
  );
}

