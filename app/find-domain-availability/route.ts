import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("query")?.toLowerCase();

  if (!name) {
    return new NextResponse(
      JSON.stringify({ error: "Query parameter is missing" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const tlds = [
    ".com",
    ".ai",
    ".io",
    ".co",
    ".so",
    ".dev",
    ".app",
    ".net",
    ".org",
    ".net",
  ];

  const domains = tlds.map((tld) => `${name}${tld}`);

  const availabilityResults = [];

  for (const domain of domains) {
    try {
      const response = await fetch(
        `https://api.whoxy.com/?key=${process.env.WHOXY_API_KEY}&whois=${domain}`
      );

      if (!response.ok) {
        return new NextResponse(
          JSON.stringify({ error: "Failed to fetch WHOIS data" }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await response.json();

      if (data.domain_registered.toLowerCase() === "no") {
        availabilityResults.push({ domain, available: true });
      } else {
        availabilityResults.push({ domain, available: false });
      }

      if (availabilityResults.filter(result => result.available).length === 3) {
        break;
      }
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch WHOIS data" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return new NextResponse(JSON.stringify({ availabilityResults }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
