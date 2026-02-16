import { isFullDay, type Duration } from '~/utils/slots'

interface Schedule {
  id: number
  userId: number | null
  date: string
  ownerStatus: string
  slots: string
  startTime: string
  endTime: string
  source: string
  createdAt: string
  updatedAt: string
}

interface Ticket {
  id: number
  zones: string
  zoneLabels: string
  activationDate: string
  finishDate: string
}

interface TicketRequest {
  id: number
  userId: number | null
  date: string
  requesterName: string
  requesterContact: string
  requesterEmail: string | null
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  duration: string
  startTime: string | null
  slots: string | null
  reminderSent: number
  createdAt: string
  updatedAt: string
}

export const useScheduleStore = defineStore('schedule', () => {
  const auth = useAuthStore()

  const ownerDates = ref<Schedule[]>([])
  const requests = ref<TicketRequest[]>([])
  const ticket = ref<Ticket | null>(null)
  const loading = ref(false)

  const ownerDateSet = computed(() => new Set(ownerDates.value.map((d) => d.date)))

  const pendingRequests = computed(() => requests.value.filter((r) => r.status === 'pending'))
  const approvedRequests = computed(() => requests.value.filter((r) => r.status === 'approved'))

  async function fetchSchedules(userId: number) {
    ownerDates.value = await $fetch<Schedule[]>('/api/schedule', {
      query: { userId },
    })
  }

  async function fetchTicket(userId: number) {
    ticket.value = await $fetch<Ticket | null>('/api/ticket', {
      query: { userId },
    })
  }

  async function saveTicket(data: { zones: string; zoneLabels?: string; activationDate: string; finishDate: string }) {
    await $fetch('/api/ticket', {
      method: 'POST',
      body: data,
    })
    if (auth.user) await fetchTicket(auth.user.id)
  }

  async function fetchRequests(userId: number) {
    requests.value = await $fetch<TicketRequest[]>('/api/requests', {
      query: { userId },
    })
  }

  async function addOwnerDates(dates: Array<{ date: string, startTime: string, endTime: string }>) {
    await $fetch('/api/schedule', {
      method: 'POST',
      body: { dates },
    })
    if (auth.user) await fetchSchedules(auth.user.id)
  }

  async function syncPlanday() {
    const result = await $fetch<{ success: boolean; synced: number; removed: number }>('/api/schedule/sync', {
      method: 'POST',
    })
    if (auth.user) await fetchSchedules(auth.user.id)
    return result
  }

  async function removeOwnerDate(date: string) {
    await $fetch(`/api/schedule/${date}`, {
      method: 'DELETE',
    })
    if (auth.user) await fetchSchedules(auth.user.id)
  }

  async function submitRequest(data: {
    userId: number
    date: string
    requesterName: string
    requesterContact: string
    requesterEmail?: string
    note?: string
    duration?: Duration
    startTime?: string
  }) {
    const result = await $fetch('/api/requests', {
      method: 'POST',
      body: data,
    })
    await fetchRequests(data.userId)
    return result
  }

  async function updateRequestStatus(id: number, status: 'approved' | 'rejected') {
    await $fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      body: { status },
    })
    if (auth.user) await fetchRequests(auth.user.id)
  }

  async function deleteRequest(id: number) {
    await $fetch(`/api/requests/${id}`, {
      method: 'DELETE',
    })
    if (auth.user) await fetchRequests(auth.user.id)
  }

  function getOwnerTimeRange(date: string): { startTime: string, endTime: string } | null {
    const schedule = ownerDates.value.find(s => s.date === date)
    if (!schedule) return null
    return { startTime: schedule.startTime, endTime: schedule.endTime }
  }

  function isDateFullyOccupied(date: string): boolean {
    const schedule = ownerDates.value.find(s => s.date === date)
    if (!schedule) return false
    return isFullDay(schedule.startTime, schedule.endTime)
  }

  return {
    ownerDates,
    requests,
    ticket,
    loading,
    ownerDateSet,
    pendingRequests,
    approvedRequests,
    fetchSchedules,
    fetchTicket,
    saveTicket,
    fetchRequests,
    addOwnerDates,
    syncPlanday,
    removeOwnerDate,
    submitRequest,
    updateRequestStatus,
    deleteRequest,
    getOwnerTimeRange,
    isDateFullyOccupied,
  }
})
