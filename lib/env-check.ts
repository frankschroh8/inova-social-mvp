export function checkEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET"
  ]

  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`❌ Missing env: ${key}`)
    }
  })
}