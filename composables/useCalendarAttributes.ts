export function useCalendarAttributes() {
  const schedule = useScheduleStore()

  const attributes = computed(() => {
    const attrs: any[] = []

    // Red = owner using ticket
    for (const s of schedule.ownerDates) {
      attrs.push({
        key: `owner-${s.date}`,
        highlight: { color: 'red', fillMode: 'solid' },
        dates: new Date(s.date + 'T00:00:00'),
      })
    }

    // Yellow = pending request
    for (const r of schedule.pendingRequests) {
      attrs.push({
        key: `pending-${r.id}`,
        highlight: { color: 'yellow', fillMode: 'light' },
        dates: new Date(r.date + 'T00:00:00'),
      })
    }

    // Blue = approved request
    for (const r of schedule.approvedRequests) {
      attrs.push({
        key: `approved-${r.id}`,
        highlight: { color: 'blue', fillMode: 'solid' },
        dates: new Date(r.date + 'T00:00:00'),
      })
    }

    // Green outline = today
    attrs.push({
      key: 'today',
      highlight: { color: 'green', fillMode: 'outline' },
      dates: new Date(),
    })

    return attrs
  })

  return { attributes }
}
