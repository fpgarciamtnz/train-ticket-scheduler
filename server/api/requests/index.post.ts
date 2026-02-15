import { eq } from 'drizzle-orm'
import { schedules, requests } from '~~/server/db/schema'

const VALID_DURATIONS = ['4h', '8h', '12h', '24h']

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

function isFullDayCheck(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  return s <= 360 && e >= 1440
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    date: string
    requesterName: string
    requesterContact: string
    note?: string
    duration?: string
    startTime?: string
  }>(event)

  if (!body.date || !body.requesterName || !body.requesterContact) {
    throw createError({ statusCode: 400, statusMessage: 'date, requesterName, and requesterContact are required' })
  }

  const duration = body.duration || '8h'
  if (!VALID_DURATIONS.includes(duration)) {
    throw createError({ statusCode: 400, statusMessage: 'duration must be 4h, 8h, 12h, or 24h' })
  }

  // Block requests for fully-occupied dates
  const ownerDate = await db.select().from(schedules).where(eq(schedules.date, body.date)).get()
  if (ownerDate && isFullDayCheck(ownerDate.startTime, ownerDate.endTime)) {
    throw createError({ statusCode: 409, statusMessage: 'This date is not available — the owner is using the ticket all day' })
  }

  const now = new Date().toISOString()
  const result = await db.insert(requests).values({
    date: body.date,
    requesterName: body.requesterName,
    requesterContact: body.requesterContact,
    note: body.note ?? null,
    duration,
    startTime: body.startTime ?? null,
    slots: null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }).returning()

  return result[0]
})
