import { eq } from 'drizzle-orm'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; pin: string }>(event)

  if (!body.email || !body.pin) {
    throw createError({ statusCode: 400, statusMessage: 'Email and PIN are required' })
  }

  const email = body.email.toLowerCase().trim()
  const user = await db.select().from(users).where(eq(users.email, email)).get()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or PIN' })
  }

  const valid = await verifyPin(body.pin, email, user.pin)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or PIN' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, slug: user.slug },
  })

  return { id: user.id, email: user.email, name: user.name, slug: user.slug }
})
