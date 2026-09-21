import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser, readBody, adminClient, accessError, AccessError } from "@/lib/provider-access";

export async function POST(req: Request) {
  try {
    const { user, client } = await requireUser(req);
    const { ids } = await readBody(req, z.object({ ids: z.array(z.string().uuid()).min(1).max(20) }));
    const nameIds = Array.from(new Set(ids)).sort();
    const { data: names, error } = await client.from("names").select("id").in("id", nameIds).eq("created_by", user.id);
    if (error) throw error;
    if (names?.length !== nameIds.length) throw new AccessError(403, "You can only share names you own.");
    const { data, error: shareError } = await adminClient().from("name_shares")
      .upsert({ created_by: user.id, name_ids: nameIds }, { onConflict: "created_by,name_ids" }).select("token").single();
    if (shareError) throw shareError;
    return NextResponse.json({ path: `/share/${data.token}` }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
