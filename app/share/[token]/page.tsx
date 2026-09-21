import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { adminClient } from "@/lib/provider-access";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function SharedNames({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();
  const admin = adminClient();
  const { data: share, error } = await admin.from("name_shares").select("name_ids,created_by").eq("token", token).maybeSingle();
  if (error) throw new Error("Unable to load shared names");
  if (!share) notFound();
  const { data: names, error: namesError } = await admin.from("names").select("id,name,description")
    .in("id", share.name_ids).eq("created_by", share.created_by);
  if (namesError) throw new Error("Unable to load shared names");
  return <main className="mx-auto max-w-2xl space-y-6 p-8">
    <h1 className="text-2xl font-semibold">Shared names</h1>
    {names?.map(name => <article key={name.id} className="rounded-lg border p-5">
      <h2 className="text-xl font-semibold">{name.name}</h2>
      <p className="mt-2 text-muted-foreground">{name.description}</p>
    </article>)}
    <Link className="underline" href="/new">Create your own names</Link>
  </main>;
}
