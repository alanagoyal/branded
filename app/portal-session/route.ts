import { baseUrl } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customer_id");

  if (!customerId) {
    return new NextResponse(JSON.stringify({ error: "Company ID is required" }), {
      status: 400,
      headers: {"content-type": "application/json"},
    });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/new?customer_id=${customerId}`
    });
    return new NextResponse(JSON.stringify({ session }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create billing portal session" }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
  
}
