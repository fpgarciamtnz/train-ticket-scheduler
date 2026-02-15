import type { H3Event } from 'h3'

interface PlandayTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  refresh_token: string
}

interface PlandayShift {
  id: number
  startDateTime: string
  endDateTime: string
  employeeId: number
}

interface PlandayShiftsResponse {
  data: PlandayShift[]
  paging: { offset: number; limit: number; total: number }
}

export async function getPlandayAccessToken(event: H3Event): Promise<string> {
  const config = useRuntimeConfig(event)
  const res = await $fetch<PlandayTokenResponse>('https://id.planday.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.plandayClientId,
      grant_type: 'refresh_token',
      refresh_token: config.plandayRefreshToken,
    }).toString(),
  })
  return res.access_token
}

export async function fetchPlandayShifts(event: H3Event, from: string, to: string): Promise<PlandayShift[]> {
  const config = useRuntimeConfig(event)
  const token = await getPlandayAccessToken(event)

  const shifts: PlandayShift[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const res = await $fetch<PlandayShiftsResponse>('https://openapi.planday.com/scheduling/v1.0/shifts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-ClientId': config.plandayClientId,
      },
      query: {
        from,
        to,
        employeeId: config.plandayEmployeeId,
        offset,
        limit,
      },
    })
    shifts.push(...res.data)
    if (shifts.length >= res.paging.total) break
    offset += limit
  }

  return shifts
}

export function parseShiftTimes(shift: PlandayShift): { date: string; startTime: string; endTime: string } {
  const start = new Date(shift.startDateTime)
  const end = new Date(shift.endDateTime)
  const date = shift.startDateTime.slice(0, 10) // YYYY-MM-DD
  const startTime = `${String(start.getHours()).padStart(2, '0')}:00`
  const endTime = `${String(end.getHours()).padStart(2, '0')}:00`
  return { date, startTime, endTime }
}
