import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GODADDY_API_KEY;
const secret = process.env.GODADDY_API_SECRET;
const baseURL = "https://api.godaddy.com/v1/domains/suggest";
const priceURL = "https://api.godaddy.com/v1/domains/purchase";

type Data = {
  domains?: string[];
  error?: string;
};

export async function GET(req: NextRequest, res: NextResponse<Data>) {
  const query = req.nextUrl.searchParams.get('query');
  const url = `${baseURL}?query=${query}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `sso-key ${apiKey}:${secret}`,
    },
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.code === "ACCESS_DENIED") {
      return Response.json({ error: "Access denied" });
    }

    const domains: {
        domain: string;
        purchaseLink: string
    }[] = []

    let count = 0;

    for (const item of data) {
      const domain = `www.${item.domain}`;

      if (count < 3) {
        const purchaseLink = `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${domain}`;
        domains.push({ domain, purchaseLink });
        count++; 
      }
    }
    
    return Response.json({ domains });
  } catch (error) {
    console.log(error);
    return Response.json({ error });
  }
}
