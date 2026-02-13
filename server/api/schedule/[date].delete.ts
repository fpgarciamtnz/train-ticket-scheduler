import { eq } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'date parameter is required' })
  }

  await db.delete(schedules).where(eq(schedules.date, date))
  return { success: true }
})
