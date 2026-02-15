import { eq } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

const TIME_RE = /^([01]\d|2[0-4]):00$/

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{ dates: Array<{ date: string, startTime: string, endTime: string }> }>(event)
  if (!body.dates || !Array.isArray(body.dates) || body.dates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'dates array is required' })
  }

  const now = new Date().toISOString()

  for (const entry of body.dates) {
    if (!entry.date || !entry.startTime || !entry.endTime) {
      throw createError({ statusCode: 400, statusMessage: 'Each entry must have date, startTime, and endTime' })
    }
    if (!TIME_RE.test(entry.startTime) || !TIME_RE.test(entry.endTime)) {
      throw createError({ statusCode: 400, statusMessage: 'startTime and endTime must be in HH:mm format' })
    }

    const existing = await db.select().from(schedules).where(eq(schedules.date, entry.date)).get()

    if (existing) {
      await db.update(schedules).set({
        startTime: entry.startTime,
        endTime: entry.endTime,
        updatedAt: now,
      }).where(eq(schedules.date, entry.date))
    } else {
      await db.insert(schedules).values({
        date: entry.date,
        ownerStatus: 'using',
        startTime: entry.startTime,
        endTime: entry.endTime,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return { success: true, count: body.dates.length }
})
