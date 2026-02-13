import { eq } from 'drizzle-orm'
import { requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'valid id parameter is required' })
  }

  const body = await readBody<{ status: 'approved' | 'rejected' }>(event)
  if (!body.status || !['approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'status must be "approved" or "rejected"' })
  }

  const result = await db.update(requests)
    .set({ status: body.status, updatedAt: new Date().toISOString() })
    .where(eq(requests.id, id))
    .returning()

  if (result.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Request not found' })
  }

  return result[0]
})
