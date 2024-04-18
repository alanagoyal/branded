import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customer_id");
  try {
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
      });

      const currentSubscription = subscriptions.data[0];
      const planId = currentSubscription.items.data[0].plan.product;
      const cancelAtPeriodEnd = currentSubscription.cancel_at_period_end;
      return new NextResponse(JSON.stringify({ planId, cancelAtPeriodEnd, customerId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch customer session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
