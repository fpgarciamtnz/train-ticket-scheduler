import { eq } from 'drizzle-orm'
import { users } from '~~/server/db/schema'

const PIN_RE = /^\d{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string; pin: string }>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (!body.email || !EMAIL_RE.test(body.email)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email is required' })
  }
  if (!body.pin || !PIN_RE.test(body.pin)) {
    throw createError({ statusCode: 400, statusMessage: 'PIN must be exactly 4 digits' })
  }

  const email = body.email.toLowerCase().trim()

  // Check for existing user
  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }

  const hashedPin = await hashPin(body.pin, email)

  // Generate slug, handle collisions
  let slug = generateSlug(body.name)
  if (!slug) slug = 'user'
  const slugExists = await db.select().from(users).where(eq(users.slug, slug)).get()
  if (slugExists) {
    slug = slug + '-' + Math.random().toString(36).slice(2, 6)
  }

  const now = new Date().toISOString()
  const result = await db.insert(users).values({
    email,
    pin: hashedPin,
    name: body.name.trim(),
    slug,
    createdAt: now,
    updatedAt: now,
  }).returning()

  const user = result[0]

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, slug: user.slug },
  })

  return { id: user.id, email: user.email, name: user.name, slug: user.slug }
})
