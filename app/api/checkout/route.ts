import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Inova Social PRO",
            },
            unit_amount: 2900,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000?success=true",
      cancel_url: "http://localhost:3000?cancel=true",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}