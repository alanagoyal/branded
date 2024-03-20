import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { compile } from "@onedoc/react-print"
import { Receipt } from "../documents/receipt";
import { Onedoc } from "@onedoc/client"

const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!)

export async function GET(req: NextRequest) {
  const { file, error } = await onedoc.render({
    html: await compile(Receipt())
  })

  if (error) {
    return NextResponse.json({error}, {status: 500})
  }

  const pdfBuffer = Buffer.from(file)

  return new Response(pdfBuffer, {
    headers: {
        "Content-Type": "application/pdf"
    }
  })
}
