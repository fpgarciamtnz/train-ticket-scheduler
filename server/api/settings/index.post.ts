import { eq } from 'drizzle-orm'
import { settings } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{ key: string; value: string }>(event)
  if (!body.key || typeof body.value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'key and value are required' })
  }

  const now = new Date().toISOString()
  const existing = await db.select().from(settings).where(eq(settings.key, body.key)).get()

  if (existing) {
    await db.update(settings)
      .set({ value: body.value, updatedAt: now })
      .where(eq(settings.key, body.key))
  } else {
    await db.insert(settings).values({
      key: body.key,
      value: body.value,
      updatedAt: now,
    })
  }

  return { success: true }
})
