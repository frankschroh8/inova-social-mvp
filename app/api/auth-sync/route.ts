import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (!data) {
    await supabase.from("profiles").insert({
      email,
      plan: "free",
      ai_usage: 0,
    });
  }

  return NextResponse.json({ ok: true });
}
