import { eq, desc } from 'drizzle-orm'
import { tickets } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = Number(query.userId)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId query parameter is required' })
  }

  const ticket = await db.select({
    id: tickets.id,
    zones: tickets.zones,
    activationDate: tickets.activationDate,
    finishDate: tickets.finishDate,
  }).from(tickets)
    .where(eq(tickets.userId, userId))
    .orderBy(desc(tickets.createdAt))
    .get()

  return ticket ?? null
})
