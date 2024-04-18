import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get("plan_id");
  if (!planId) {
    return new NextResponse(JSON.stringify({ error: "Plan not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  try {
    const planMapping = {
        [process.env.FREE_PLAN_ID_PRODUCTION!]: "Free",
        [process.env.PRO_PLAN_ID_PRODUCTION!]: "Pro",
        [process.env.BUSINESS_PLAN_ID_PRODUCTION!]: "Business",
        [process.env.FREE_PLAN_ID_TEST!]: "Free",
        [process.env.PRO_PLAN_ID_TEST!]: "Pro",
        [process.env.BUSINESS_PLAN_ID_TEST!]: "Business",
      };

    const planName = planMapping[planId];

    if (planName) {
      return new NextResponse(JSON.stringify({ planName }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return new NextResponse(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
