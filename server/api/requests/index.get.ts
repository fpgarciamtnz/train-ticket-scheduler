import { eq, desc } from 'drizzle-orm'
import { requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined

  let q = db.select().from(requests).orderBy(desc(requests.createdAt)).$dynamic()

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    q = q.where(eq(requests.status, status as 'pending' | 'approved' | 'rejected'))
  }

  return await q
})
