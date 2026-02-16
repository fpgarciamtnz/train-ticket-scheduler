export const ZONES = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export type Zone = typeof ZONES[number]

export function parseZones(csv: string | null | undefined): Zone[] {
  if (!csv) return []
  return csv.split(',').filter((s): s is Zone => ZONES.includes(s as Zone))
}

export function serializeZones(zones: Zone[]): string {
  return zones.filter(z => ZONES.includes(z)).join(',')
}

export function formatZones(csv: string | null | undefined): string {
  return parseZones(csv).join(', ')
}
