import AuthRefresh from "@/components/auth-refresh";
import { NameGenerator } from "@/components/name-generator";
import NewGeneration from "@/components/new-generation";
import { Button } from "@/components/ui/button";
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

  let names;
  let idsList;

  if (searchParams && searchParams.ids) {
    const idString = searchParams.ids as string;
    const idRegex = /.{36}/g;
    idsList = idString.match(idRegex);

    const { data, error } = await supabase
      .from("names")
      .select()
      .in("id", idsList!);
    names = data;
  } else {
    names = null;
  }

  return (
    <div className="w-full px-4">
      <AuthRefresh idsList={idsList ?? []} />
      <NewGeneration user={user} names={names} />
    </div>
  );
}
