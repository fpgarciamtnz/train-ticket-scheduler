interface Env {
  DB: D1Database
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  TIMEZONE_OFFSET_MINUTES: string
}

interface RequestRow {
  id: number
  date: string
  requester_name: string
  requester_contact: string
  requester_email: string | null
  status: string
  note: string | null
  duration: string
  start_time: string | null
  reminder_sent: number
  schedule_start_time: string | null
  owner_email: string
}

async function sendEmail(env: Env, to: string | string[], subject: string, html: string) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const tzOffset = parseInt(env.TIMEZONE_OFFSET_MINUTES || '0', 10)
    const now = new Date(Date.now() + tzOffset * 60_000)

    const todayStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

    // Get approved requests for today that haven't had reminders sent
    // Join with users table to get owner email, and schedules for start time
    const { results } = await env.DB.prepare(`
      SELECT r.*, s.start_time as schedule_start_time, u.email as owner_email
      FROM requests r
      LEFT JOIN schedules s ON r.date = s.date AND r.user_id = s.user_id
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.status = 'approved'
        AND r.reminder_sent = 0
        AND r.date = ?
    `).bind(todayStr).all<RequestRow>()

    if (!results || results.length === 0) return

    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (const req of results) {
      // Determine effective start time: request's start_time > schedule's start_time > default 06:00
      const effectiveTimeStr = req.start_time || req.schedule_start_time || '06:00'
      const [h, m] = effectiveTimeStr.split(':').map(Number)
      const startMinutes = h * 60 + (m || 0)

      // Check if we're within the 55-65 minute window before start
      const minutesUntilStart = startMinutes - currentMinutes
      if (minutesUntilStart < 55 || minutesUntilStart > 65) continue

      const recipients: string[] = []
      if (req.owner_email) recipients.push(req.owner_email)
      if (req.requester_email) recipients.push(req.requester_email)

      if (recipients.length === 0) continue

      const subject = `Reminder: Ticket request for ${req.requester_name} starts in ~1 hour`
      const html = `
        <h2>Upcoming Ticket Request</h2>
        <p>This is a reminder that the following approved request starts in approximately 1 hour:</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Date</td><td>${req.date}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name</td><td>${req.requester_name}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Contact</td><td>${req.requester_contact}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Duration</td><td>${req.duration}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Start Time</td><td>${effectiveTimeStr}</td></tr>
          ${req.note ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Note</td><td>${req.note}</td></tr>` : ''}
        </table>
      `

      try {
        await sendEmail(env, recipients, subject, html)
      } catch {
        // Log but don't stop processing other requests
        console.error(`Failed to send reminder for request ${req.id}`)
        continue
      }

      // Mark reminder as sent
      await env.DB.prepare(
        `UPDATE requests SET reminder_sent = 1 WHERE id = ?`
      ).bind(req.id).run()
    }
  },
}
