import Stripe from "stripe";
import { supabaseAdmin } from "@/supabase/admin";
import { headers } from "next/headers";
import { buffer } from "node:stream/consumers";

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET!;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: any) {
  const rawBody = await buffer(req.body);
  try {
    const sig = headers().get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
    } catch (err) {
      return Response.json({ error: `Webhook Error: ${err}` });
    }

    const supabase = await supabaseAdmin();
    let result;
    let customerId;
    let planId;

    switch (event.type) {
      case "customer.subscription.updated":
        result = event.data.object;
        customerId = result.customer as string;
        planId = result.cancel_at_period_end
          ? null
          : (result.items.data[0]?.plan.product as string);
        const newCustomerId = result.cancel_at_period_end ? null : customerId;

        const { error: updatedError } = await supabase
          .from("profiles")
          .update({
            plan_id: planId,
            customer_id: newCustomerId,
          })
          .eq("customer_id", customerId);

        if (updatedError) {
          return Response.json({ error: updatedError.message });
        }
        break;
    }
    return Response.json({});
  } catch (err) {
    return Response.json({ error: `Webhook Error: ${err}` });
  }
}
