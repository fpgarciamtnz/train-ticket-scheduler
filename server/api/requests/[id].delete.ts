import { eq, and } from 'drizzle-orm'
import { requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'valid id parameter is required' })
  }

  await db.delete(requests).where(and(eq(requests.id, id), eq(requests.userId, user.id)))
  return { success: true }
})
