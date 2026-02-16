export const TIME_SLOTS = ['morning', 'midday', 'evening'] as const
export type TimeSlot = typeof TIME_SLOTS[number]

export const DURATION_OPTIONS = [
  { label: '4 hours', value: '4h' },
  { label: '8 hours', value: '8h' },
  { label: '12 hours', value: '12h' },
  { label: '24 hours', value: '24h' },
] as const
export type Duration = '4h' | '8h' | '12h' | '24h'

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning (06:00\u201312:00)',
  midday: 'Midday (12:00\u201318:00)',
  evening: 'Evening (18:00\u201300:00)',
}

export const SLOT_ICONS: Record<TimeSlot, string> = {
  morning: 'i-heroicons-sun',
  midday: 'i-heroicons-cloud',
  evening: 'i-heroicons-moon',
}

export function parseSlots(csv: string | null | undefined): TimeSlot[] {
  if (!csv) return []
  return csv.split(',').filter((s): s is TimeSlot => TIME_SLOTS.includes(s as TimeSlot))
}

export function serializeSlots(slots: TimeSlot[]): string {
  return slots.filter(s => TIME_SLOTS.includes(s)).join(',')
}

export function getAvailableSlots(ownerSlotsCsv: string | null | undefined): TimeSlot[] {
  const ownerSlots = parseSlots(ownerSlotsCsv)
  return TIME_SLOTS.filter(s => !ownerSlots.includes(s)) as TimeSlot[]
}

// --- Time-range helpers ---

/** Convert "HH:mm" → total minutes since midnight */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Format "HH:mm" → "06:00" (24-hour format) */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

/** Format a start/end pair → "06:00 - 12:00" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

/** Does this range cover the entire day? (06:00–24:00 or 00:00–24:00) */
export function isFullDay(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  return s <= 360 && e >= 1440 // starts at-or-before 6:00 and ends at-or-after 24:00
}
