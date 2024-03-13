import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GODADDY_API_KEY;
const secret = process.env.GODADDY_API_SECRET;
const baseURL = "https://api.godaddy.com/v1/domains/suggest";

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
    const domains = data.map((item: { domain: string }) => item.domain);
    return Response.json({ domains });
  } catch (error) {
    console.log(error);
    return Response.json({ error });
  }
}
