export default defineEventHandler((event) => {
  requireAdmin(event)
  return { valid: true }
})
