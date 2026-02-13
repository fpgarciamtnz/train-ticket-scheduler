import { eq } from 'drizzle-orm'
import { requests } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'valid id parameter is required' })
  }

  await db.delete(requests).where(eq(requests.id, id))
  return { success: true }
})
