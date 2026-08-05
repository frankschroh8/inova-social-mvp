import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
})


export async function POST(req: Request) {
  try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook error: ${err.message}` },
        { status: 400 }
      )
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any

      const userId = session.metadata?.user_id

      if (!userId) {
        return NextResponse.json(
          { error: "Missing user_id in metadata" },
          { status: 400 }
        )
      }

      await supabase
        .from("profiles")
        .update({ plan: "pro" })
        .eq("user_id", userId)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}