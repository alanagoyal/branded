import { NameGenerator } from "@/components/name-generator";
import { createClient } from "@/utils/supabase/server";

export default async function GenerateName({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let names = null;

  if (searchParams && searchParams.ids) {
    const idString = searchParams.ids as string;
    const idRegex = /.{36}/g;
    const idsList = idString.match(idRegex);

    const { data: names, error } = await supabase
    .from("names")
    .select()
    .in("id", idsList!);
  }

  return (
    <div className="w-full px-4">
      <h1 className="text-2xl font-bold mb-4">Name Generator</h1>
      <NameGenerator user={user} names={names} />
    </div>
  );
}
