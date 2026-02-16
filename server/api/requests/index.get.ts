import { eq, and, desc } from 'drizzle-orm'
import { requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = Number(query.userId)
  const status = query.status as string | undefined

  if (!userId || isNaN(userId)) {
    throw createError({ statusCode: 400, statusMessage: 'userId query parameter is required' })
  }

  const conditions = [eq(requests.userId, userId)]
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    conditions.push(eq(requests.status, status as 'pending' | 'approved' | 'rejected'))
  }

  return await db.select().from(requests)
    .where(and(...conditions))
    .orderBy(desc(requests.createdAt))
})
