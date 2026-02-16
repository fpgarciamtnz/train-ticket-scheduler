export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const user = session.user as { id: number; email: string; name: string; slug: string } | undefined
  return user || null
})
