import { eq, and } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'date parameter is required' })
  }

  await db.delete(schedules).where(and(eq(schedules.userId, user.id), eq(schedules.date, date)))
  return { success: true }
})
