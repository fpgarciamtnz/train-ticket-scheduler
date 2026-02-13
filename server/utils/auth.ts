import type { H3Event } from 'h3'

export function requireAdmin(event: H3Event) {
  const pin = getHeader(event, 'x-admin-pin')
  const config = useRuntimeConfig(event)
  if (!pin || pin !== config.adminPin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
