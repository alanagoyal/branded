import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let name = req.nextUrl.searchParams.get("query");

  if (!name) {
    return new NextResponse(
      JSON.stringify({ error: "Query parameter 'name' is missing or empty." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  name = name.toLowerCase();

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
  ];
  const domains: string[] = [];

  tlds.forEach((tld) => {
    const domain = `${name}${tld}`.toLowerCase();
    domains.push(domain);
  });

  try {
    const fetchPromises = domains.map((domain) =>
      fetch(
        `https://api.whoxy.com/?key=${process.env.WHOXY_API_KEY}&whois=${domain}`
      )
    );

    const responses = await Promise.all(fetchPromises);

    const dataPromises = responses.map((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch WHOIS data");
      }
      return response.json();
    });

    const results = await Promise.all(dataPromises);

    const availabilityResults = results
      .map((data, index) => ({
        domain: domains[index],
        available: data.domain_registered.toLowerCase() === "no",
      }))
      .filter((result) => result.available);

    return new NextResponse(
      JSON.stringify({ availabilityResults: availabilityResults.slice(0, 3) }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
