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
  morning: 'Morning (6am\u201312pm)',
  midday: 'Midday (12pm\u20136pm)',
  evening: 'Evening (6pm\u201312am)',
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
