import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event;

    // ⚠️ validação do Stripe (essencial)
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook error: ${err.message}` },
        { status: 400 }
      );
    }

    // 💰 PAGAMENTO CONFIRMADO
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const email = session.customer_details?.email;

      if (email) {
        await supabase
          .from("profiles")
          .update({ plan: "pro" })
          .eq("email", email);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}