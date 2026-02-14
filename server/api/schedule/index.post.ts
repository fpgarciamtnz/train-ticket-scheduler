import { eq } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{ dates: Array<{ date: string, slots: string }> }>(event)
  if (!body.dates || !Array.isArray(body.dates) || body.dates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'dates array is required' })
  }

  const now = new Date().toISOString()

  for (const entry of body.dates) {
    if (!entry.date || !entry.slots) {
      throw createError({ statusCode: 400, statusMessage: 'Each entry must have a date and slots' })
    }

    const existing = await db.select().from(schedules).where(eq(schedules.date, entry.date)).get()

    if (existing) {
      await db.update(schedules).set({
        slots: entry.slots,
        updatedAt: now,
      }).where(eq(schedules.date, entry.date))
    } else {
      await db.insert(schedules).values({
        date: entry.date,
        ownerStatus: 'using',
        slots: entry.slots,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return { success: true, count: body.dates.length }
})
