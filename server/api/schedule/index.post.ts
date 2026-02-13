import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{ dates: string[] }>(event)
  if (!body.dates || !Array.isArray(body.dates) || body.dates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'dates array is required' })
  }

  const now = new Date().toISOString()
  const values = body.dates.map((date) => ({
    date,
    ownerStatus: 'using' as const,
    createdAt: now,
    updatedAt: now,
  }))

  await db.insert(schedules).values(values).onConflictDoNothing()
  return { success: true, count: values.length }
})
