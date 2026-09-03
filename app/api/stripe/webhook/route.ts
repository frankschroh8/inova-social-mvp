import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

function requiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing server environment variable: ${name}`)
  }

  return value
}

const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2026-06-24.dahlia",
})


export async function POST(req: Request) {
  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      )
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        requiredEnv("STRIPE_WEBHOOK_SECRET")
      )
    } catch (err: any) {
      return NextResponse.json(
        { error: "Invalid Stripe webhook signature." },
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

      const supabaseAdmin = createSupabaseAdminClient()
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: "pro" })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Erro ao atualizar plano no webhook Stripe:", updateError)

        return NextResponse.json(
          { error: "Erro ao atualizar plano do usuário." },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Erro no webhook Stripe:", error)

    return NextResponse.json(
      { error: "Erro interno no webhook Stripe." },
      { status: 500 }
    )
  }
}
