import { NextResponse } from "next/server";
import { createOnePagerPdf } from "@/lib/one-pager-pdf";
import { z } from "zod";
import { onePagerLogo } from "@/lib/one-pager-logo";
import { requireUser, reserveUsage, readBody, nameSchema, accessError, AccessError } from "@/lib/provider-access";

export const maxDuration = 20;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, client } = await requireUser(req);
    const { nameId, content } = await readBody(req, z.object({ nameId: z.string().uuid(), content: z.string().trim().min(1).max(8000) }));
    const { data: nameData, error: nameError } = await client.from("names").select("name")
      .eq("id", nameId).eq("created_by", user.id).maybeSingle();
    if (nameError) throw nameError;
    if (!nameData) throw new AccessError(404, "Name not found.");
    nameSchema.parse(nameData.name);
    const { data: logo, error: logoError } = await client.from("logos").select("logo_url")
      .eq("name_id", nameId).eq("created_by", user.id).limit(1).maybeSingle();
    if (logoError) throw logoError;
    const { data: profile, error: profileError } = await client.from("profiles").select("name").eq("id", user.id).maybeSingle();
    if (profileError) throw profileError;
    const { data: saved, error: savedError } = await client.from("one_pagers").select("id")
      .eq("name_id", nameId).eq("created_by", user.id).limit(1).maybeSingle();
    if (savedError) throw savedError;
    await reserveUsage(user.id, "onePager");
    const logoUrl = await onePagerLogo(logo?.logo_url || null);
    const link = await createOnePagerPdf({ name: nameData.name, founder: (profile?.name || "").slice(0, 200), email: (user.email || "").slice(0, 320), content, logoUrl });
    const record = { pdf_url: link, name_id: nameId, created_by: user.id };
    const { error } = saved
      ? await client.from("one_pagers").update(record).eq("id", saved.id).eq("created_by", user.id)
      : await client.from("one_pagers").insert(record);
    if (error) throw error;
    return NextResponse.json({ link }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
