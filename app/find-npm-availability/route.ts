import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, reserveUsage, accessError } from "@/lib/provider-access";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const packageName = z.string().min(1).max(214).regex(/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/).parse(req.nextUrl.searchParams.get("query"));
    await reserveUsage(user.id, "npmAvailability");
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok && response.status !== 404) throw new Error("NPM registry failed");
    return NextResponse.json({ available: response.status === 404 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
