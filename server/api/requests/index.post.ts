import { eq, and } from 'drizzle-orm'
import { schedules, requests, users } from '~~/server/db/schema'

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
    userId: number
    date: string
    requesterName: string
    requesterContact: string
    requesterEmail?: string
    note?: string
    duration?: string
    startTime?: string
  }>(event)

  if (!body.userId || !body.date || !body.requesterName || !body.requesterContact) {
    throw createError({ statusCode: 400, statusMessage: 'userId, date, requesterName, and requesterContact are required' })
  }

  const duration = body.duration || '8h'
  if (!VALID_DURATIONS.includes(duration)) {
    throw createError({ statusCode: 400, statusMessage: 'duration must be 4h, 8h, 12h, or 24h' })
  }

  // Block requests for fully-occupied dates
  const ownerDate = await db.select().from(schedules)
    .where(and(eq(schedules.userId, body.userId), eq(schedules.date, body.date)))
    .get()
  if (ownerDate && isFullDayCheck(ownerDate.startTime, ownerDate.endTime)) {
    throw createError({ statusCode: 409, statusMessage: 'This date is not available — the owner is using the ticket all day' })
  }

  const now = new Date().toISOString()
  const result = await db.insert(requests).values({
    userId: body.userId,
    date: body.date,
    requesterName: body.requesterName,
    requesterContact: body.requesterContact,
    requesterEmail: body.requesterEmail ?? null,
    note: body.note ?? null,
    duration,
    startTime: body.startTime ?? null,
    slots: null,
    status: 'pending',
    reminderSent: 0,
    createdAt: now,
    updatedAt: now,
  }).returning()

  // Send owner notification email (fire-and-forget)
  try {
    const owner = await db.select().from(users).where(eq(users.id, body.userId)).get()
    if (owner?.email) {
      const req = result[0]
      await sendEmail(event, {
        to: owner.email,
        subject: `New ticket request from ${req.requesterName} for ${req.date}`,
        html: `
          <h2>New Ticket Request</h2>
          <table style="border-collapse:collapse;">
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Date</td><td>${req.date}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name</td><td>${req.requesterName}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Contact</td><td>${req.requesterContact}</td></tr>
            ${req.requesterEmail ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td>${req.requesterEmail}</td></tr>` : ''}
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Duration</td><td>${req.duration}</td></tr>
            ${req.startTime ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Start Time</td><td>${req.startTime}</td></tr>` : ''}
            ${req.note ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Note</td><td>${req.note}</td></tr>` : ''}
          </table>
          <p style="margin-top:16px;color:#666;">Log in to your dashboard to review this request.</p>
        `,
      })
    }
  } catch {
    // Email failure should not break the request submission
  }

  return result[0]
})
