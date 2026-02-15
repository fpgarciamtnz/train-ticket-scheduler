import type { H3Event } from 'h3'

export async function sendEmail(event: H3Event, options: {
  to: string | string[]
  subject: string
  html: string
}) {
  const config = useRuntimeConfig(event)
  if (!config.resendApiKey || !config.resendFromEmail) return

  await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      from: config.resendFromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    },
  })
}
