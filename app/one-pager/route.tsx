import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { compile } from "@onedoc/react-print";
import { Onedoc } from "@onedoc/client";
import { BusinessCard } from "../documents/business-card"
const onedoc = new Onedoc(process.env.ONEDOC_API_KEY!);

export async function GET(req: NextRequest) {
    const body = await req.json();
    const { nameData, userData, logoUrl } = body;

    const { file, error } = await onedoc.render({
        html: await compile(
            <BusinessCard
                nameData={nameData}
                userData={userData}
                logoUrl={logoUrl}
            />
        ),
    });

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(file);

    return new Response(pdfBuffer, {
        headers: {
            "Content-Type": "application/pdf",
        },
    });
}
