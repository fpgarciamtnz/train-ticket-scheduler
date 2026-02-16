import { eq, desc } from 'drizzle-orm'
import { users, tickets } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug query parameter is required' })
  }

  const user = await db.select({
    id: users.id,
    name: users.name,
    slug: users.slug,
  }).from(users).where(eq(users.slug, slug)).get()

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const ticket = await db.select({
    zones: tickets.zones,
    activationDate: tickets.activationDate,
    finishDate: tickets.finishDate,
  }).from(tickets)
    .where(eq(tickets.userId, user.id))
    .orderBy(desc(tickets.createdAt))
    .get()

  return { ...user, ticket: ticket ?? null }
})
