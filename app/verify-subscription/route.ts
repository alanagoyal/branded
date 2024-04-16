import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get("checkout_id");
  try {
    if (checkoutId) {
      const session = await stripe.checkout.sessions.retrieve(checkoutId);
      if (typeof session.invoice === "string") {
        const invoice = await stripe.invoices.retrieve(session.invoice);
        const subscriptionId = invoice.subscription;
        let planId = null;

        if (typeof subscriptionId === "string") {
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscriptionData.items.data.length > 0) {
            planId = subscriptionData.items.data[0].plan.product; 
          }
        }

        return new NextResponse(JSON.stringify({ invoice, subscriptionId, planId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch invoice data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
