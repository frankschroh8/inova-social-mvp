export function requirePro(plan?: string) {
  if (plan !== 'pro') {
    throw new Error('? Acesso apenas para PRO')
  }
}
