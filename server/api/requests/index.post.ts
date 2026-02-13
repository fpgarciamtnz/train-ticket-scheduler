import { eq } from 'drizzle-orm'
import { schedules, requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    date: string
    requesterName: string
    requesterContact: string
    note?: string
  }>(event)

  if (!body.date || !body.requesterName || !body.requesterContact) {
    throw createError({ statusCode: 400, statusMessage: 'date, requesterName, and requesterContact are required' })
  }

  // Check that the date is NOT marked as owner-using
  const ownerDate = await db.select().from(schedules).where(eq(schedules.date, body.date)).get()
  if (ownerDate) {
    throw createError({ statusCode: 409, statusMessage: 'This date is not available — the owner is using the ticket' })
  }

  const now = new Date().toISOString()
  const result = await db.insert(requests).values({
    date: body.date,
    requesterName: body.requesterName,
    requesterContact: body.requesterContact,
    note: body.note ?? null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }).returning()

  return result[0]
})
