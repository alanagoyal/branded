import { NextRequest, NextResponse } from "next/server";
import { compile } from "@onedoc/react-print";
import { Onedoc } from "@onedoc/client";
import { OnePager } from "../documents/one-pager";
import React from "react";
import { z } from "zod";
import { onePagerLogo } from "@/lib/one-pager-logo";
import { requireUser, reserveUsage, accessError, nameSchema } from "@/lib/provider-access";

export const maxDuration = 20;
export const dynamic = "force-dynamic";
const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!);

export async function GET(req: NextRequest) {
  try {
    const { user, client } = await requireUser(req);
    if (req.url.length > 20000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const read = (key: string) => JSON.parse(req.nextUrl.searchParams.get(key) || "null");
    const nameData = z.object({ name: nameSchema }).parse(read("nameData"));
    const content = z.string().trim().min(1).max(8000).parse(read("content"));
    const logoSource = z.string().url().max(4000).nullable().parse(read("logoUrl"));
    const { data: profile } = await client.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const userData = { name: profile?.name || "", email: user.email || "" };
    await reserveUsage(user.id, "onePager");
    const logoUrl = await onePagerLogo(logoSource);
    const { link, error } = await onedoc.render({
      html: await compile(<OnePager nameData={nameData} userData={userData} content={content} logoUrl={logoUrl} />),
      title: nameData.name, save: true,
    });
    if (error) throw new Error("PDF provider failed");
    return NextResponse.json({ link }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
