import { gte, asc, eq } from 'drizzle-orm'
import { users, schedules } from '~~/server/db/schema'

export default defineEventHandler(async () => {
  const today = new Date().toISOString().slice(0, 10)

  const allOwners = await db.select({
    id: users.id,
    name: users.name,
    slug: users.slug,
  }).from(users).orderBy(asc(users.name))

  const upcomingSchedules = await db.select({
    userId: schedules.userId,
    date: schedules.date,
    startTime: schedules.startTime,
    endTime: schedules.endTime,
  }).from(schedules)
    .where(gte(schedules.date, today))
    .orderBy(asc(schedules.date))

  const schedulesByUser = new Map<number, { date: string; startTime: string; endTime: string }[]>()
  for (const s of upcomingSchedules) {
    if (!s.userId) continue
    if (!schedulesByUser.has(s.userId)) schedulesByUser.set(s.userId, [])
    schedulesByUser.get(s.userId)!.push({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
    })
  }

  return allOwners.map(owner => ({
    ...owner,
    upcomingDates: schedulesByUser.get(owner.id) ?? [],
  }))
})
