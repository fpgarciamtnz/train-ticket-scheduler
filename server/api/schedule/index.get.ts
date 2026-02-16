import { asc, eq } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = Number(query.userId)

  if (!userId || isNaN(userId)) {
    throw createError({ statusCode: 400, statusMessage: 'userId query parameter is required' })
  }

  return await db.select().from(schedules)
    .where(eq(schedules.userId, userId))
    .orderBy(asc(schedules.date))
})
