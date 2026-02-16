import type { H3Event } from 'h3'

export async function hashPin(pin: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ':' + email.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string, email: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(pin, email)
  return hash === storedHash
}

export async function requireAuth(event: H3Event): Promise<{ id: number; email: string; name: string; slug: string }> {
  const session = await getUserSession(event)
  const user = session.user as { id: number; email: string; name: string; slug: string } | undefined
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
