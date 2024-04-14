import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function POST(req: NextRequest, res: NextResponse) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_ID_from_Stripe", // Replace with your price ID
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/cancel`,
    });

    res = new NextResponse(JSON.stringify({ sessionId: session.id }), {
      status: 200,
    });
    return res;
  } catch (error) {
    return NextResponse.json({ error });
  }
}
