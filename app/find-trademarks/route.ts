import { NextRequest, NextResponse } from "next/server";

const rapidApiKey = process.env.RAPID_API_KEY!;
export async function GET(req: NextRequest) {
  const searchTerm = req.nextUrl.searchParams.get("searchTerm")!;

  console.log(searchTerm);
  const url = `https://uspto-trademark.p.rapidapi.com/v1/trademarkSearch/${searchTerm}/active`;
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": "uspto-trademark.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(result);
    return new NextResponse(JSON.stringify(result), {
      status: 200, 
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500, 
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
