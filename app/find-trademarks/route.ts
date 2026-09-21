import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, reserveUsage, accessError } from "@/lib/provider-access";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const searchTerm = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9 -]*$/).parse(req.nextUrl.searchParams.get("searchTerm"));
    await reserveUsage(user.id, "trademarks");
    const response = await fetch(`https://uspto-trademark.p.rapidapi.com/v1/trademarkSearch/${encodeURIComponent(searchTerm)}/active`, {
      headers: { "X-RapidAPI-Key": process.env.RAPID_API_KEY!, "X-RapidAPI-Host": "uspto-trademark.p.rapidapi.com" },
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Trademark provider failed");
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
