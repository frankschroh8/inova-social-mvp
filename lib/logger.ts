export function log(event: string, data?: any) {
  console.log(`[SAAS LOG] ${event}`, data || "");
}
