import { NextResponse } from "next/server"
import { requirePro } from "@/lib/auth"

export async function POST(req: Request) {
  const { plan } = await req.json()

  try {
    requirePro(plan)

    return NextResponse.json({
      ok: true,
      message: "🔥 PRO liberado"
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message
    })
  }
}
