import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { compile } from "@onedoc/react-print";
import { Onedoc } from "@onedoc/client";
import { BusinessCard } from "../documents/business-card";

const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!);

export async function GET(req: NextRequest) {
  const nameData = JSON.parse(req.nextUrl.searchParams.get("nameData")!);
  const userData = JSON.parse(req.nextUrl.searchParams.get("userData")!);
  const content = JSON.parse(req.nextUrl.searchParams.get("content")!);


  const { link, error } = await onedoc.render({
    html: await compile(
      <BusinessCard nameData={nameData} userData={userData} content={content}/>
    ),
    save: true,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return Response.json({link})
}
