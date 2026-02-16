import { eq } from 'drizzle-orm'
import { tickets } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody<{ zones: string; activationDate: string; finishDate: string }>(event)

  if (!body.zones || body.zones.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one zone is required' })
  }

  if (!body.activationDate || !body.finishDate) {
    throw createError({ statusCode: 400, statusMessage: 'Activation date and finish date are required' })
  }

  if (body.finishDate <= body.activationDate) {
    throw createError({ statusCode: 400, statusMessage: 'Finish date must be after activation date' })
  }

  const now = new Date().toISOString()

  const existing = await db.select()
    .from(tickets)
    .where(eq(tickets.userId, user.id))
    .get()

  if (existing) {
    await db.update(tickets).set({
      zones: body.zones,
      activationDate: body.activationDate,
      finishDate: body.finishDate,
      updatedAt: now,
    }).where(eq(tickets.id, existing.id))
  } else {
    await db.insert(tickets).values({
      userId: user.id,
      zones: body.zones,
      activationDate: body.activationDate,
      finishDate: body.finishDate,
      createdAt: now,
      updatedAt: now,
    })
  }

  return { success: true }
})
