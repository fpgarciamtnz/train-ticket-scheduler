import { settings } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const rows = await db.select().from(settings)
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
})
