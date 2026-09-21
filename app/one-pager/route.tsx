import { NextResponse } from "next/server";
import { compile } from "@onedoc/react-print";
import { Onedoc } from "@onedoc/client";
import { OnePager } from "../documents/one-pager";
import React from "react";
import { z } from "zod";
import { onePagerLogo } from "@/lib/one-pager-logo";
import { requireUser, reserveUsage, readBody, nameSchema, accessError, AccessError } from "@/lib/provider-access";

export const maxDuration = 20;
export const dynamic = "force-dynamic";
const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!);

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
    const userData = { name: profile?.name || "", email: user.email || "" };
    await reserveUsage(user.id, "onePager");
    const logoUrl = await onePagerLogo(logo?.logo_url || null);
    const { link, error } = await onedoc.render({
      html: await compile(<OnePager nameData={nameData} userData={userData} content={content} logoUrl={logoUrl} />),
      title: nameData.name, save: true,
    });
    if (error) throw new Error("PDF provider failed");
    return NextResponse.json({ link }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
