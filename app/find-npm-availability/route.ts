import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const packageName = req.nextUrl.searchParams.get("query");

  const encodedNamespace = encodeURIComponent(packageName!).replace('%2F', '%2f');

  try {
    const response = await fetch(`https://registry.npmjs.org/${encodedNamespace}`);

    if (response.ok) {
      return new NextResponse(JSON.stringify({ available: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (response.status === 404) {
      return new NextResponse(JSON.stringify({ available: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new NextResponse(JSON.stringify({ error: "Unexpected response status from the registry" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch NPM registry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
