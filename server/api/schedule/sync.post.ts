import { eq, and, gte, lte, notInArray } from 'drizzle-orm'
import { format, addDays } from 'date-fns'
import { schedules } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const today = format(new Date(), 'yyyy-MM-dd')
  const until = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const shifts = await fetchPlandayShifts(event, today, until)
  const now = new Date().toISOString()

  const syncedDates: string[] = []

  for (const shift of shifts) {
    const { date, startTime, endTime } = parseShiftTimes(shift)
    syncedDates.push(date)

    const existing = await db.select().from(schedules).where(eq(schedules.date, date)).get()

    if (existing) {
      await db.update(schedules).set({
        startTime,
        endTime,
        source: 'planday',
        updatedAt: now,
      }).where(eq(schedules.date, date))
    } else {
      await db.insert(schedules).values({
        date,
        ownerStatus: 'using',
        startTime,
        endTime,
        source: 'planday',
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // Delete stale planday entries in the sync window that no longer have a matching shift
  let removed = 0
  const staleQuery = db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.source, 'planday'),
        gte(schedules.date, today),
        lte(schedules.date, until),
        ...(syncedDates.length > 0 ? [notInArray(schedules.date, syncedDates)] : []),
      ),
    )

  const staleEntries = await staleQuery
  removed = staleEntries.length

  for (const entry of staleEntries) {
    await db.delete(schedules).where(eq(schedules.id, entry.id))
  }

  return { success: true, synced: syncedDates.length, removed }
})
