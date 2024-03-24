import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { compile } from "@onedoc/react-print";
import { Onedoc } from "@onedoc/client";
import { OnePager } from "../documents/one-pager";

export const maxDuration = 20; 
export const dynamic = 'force-dynamic';

const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!);

export async function GET(req: NextRequest) {
  const nameData = JSON.parse(req.nextUrl.searchParams.get("nameData")!);
  const userData = JSON.parse(req.nextUrl.searchParams.get("userData")!);
  const content = JSON.parse(req.nextUrl.searchParams.get("content")!);

  const name = nameData.name;

  const { link, error } = await onedoc.render({
    html: await compile(
      <OnePager nameData={nameData} userData={userData} content={content}/>
    ),
    title: name,
    save: true,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return Response.json({link})
}
