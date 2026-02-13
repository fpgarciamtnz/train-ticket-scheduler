import { asc } from 'drizzle-orm'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async () => {
  return await db.select().from(schedules).orderBy(asc(schedules.date))
})
