import { eq } from 'drizzle-orm'
import { schedules, requests } from '~~/server/db/schema'

const VALID_DURATIONS = ['4h', '8h', '12h', '24h']

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    date: string
    requesterName: string
    requesterContact: string
    note?: string
    duration?: string
    slots?: string
  }>(event)

  if (!body.date || !body.requesterName || !body.requesterContact) {
    throw createError({ statusCode: 400, statusMessage: 'date, requesterName, and requesterContact are required' })
  }

  const duration = body.duration || '8h'
  if (!VALID_DURATIONS.includes(duration)) {
    throw createError({ statusCode: 400, statusMessage: 'duration must be 4h, 8h, 12h, or 24h' })
  }

  // Check for slot-level conflict
  const ownerDate = await db.select().from(schedules).where(eq(schedules.date, body.date)).get()
  if (ownerDate) {
    const ownerSlots = ownerDate.slots ? ownerDate.slots.split(',') : []
    const requestedSlots = body.slots ? body.slots.split(',') : []

    if (requestedSlots.length === 0) {
      // No specific slots requested — any owner slot is a conflict
      if (ownerSlots.length > 0) {
        throw createError({ statusCode: 409, statusMessage: 'This date is not available — the owner is using the ticket' })
      }
    } else {
      // Check if requested slots overlap with owner slots
      const overlap = requestedSlots.filter(s => ownerSlots.includes(s))
      if (overlap.length > 0) {
        throw createError({ statusCode: 409, statusMessage: `Conflicting time slots: ${overlap.join(', ')}` })
      }
    }
  }

  const now = new Date().toISOString()
  const result = await db.insert(requests).values({
    date: body.date,
    requesterName: body.requesterName,
    requesterContact: body.requesterContact,
    note: body.note ?? null,
    duration,
    slots: body.slots || null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }).returning()

  return result[0]
})
