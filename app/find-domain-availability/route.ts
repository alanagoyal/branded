import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, reserveUsage, accessError } from "@/lib/provider-access";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const name = z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/)
      .parse(req.nextUrl.searchParams.get("query")).toLowerCase();
    await reserveUsage(user.id, "domains");
    const domains = ["com", "ai", "io", "co", "dev", "app"].map(tld => `${name}.${tld}`);
    const results = await Promise.all(domains.map(async domain => {
      const response = await fetch(`https://api.whoxy.com/?key=${process.env.WHOXY_API_KEY}&whois=${encodeURIComponent(domain)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("WHOIS lookup failed");
      const data = await response.json();
      return { domain, available: data.domain_registered?.toLowerCase() === "no" };
    }));
    return NextResponse.json({ availabilityResults: results.filter(result => result.available).slice(0, 3) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
