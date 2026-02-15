import { isFullDay, type Duration } from '~/utils/slots'

interface Schedule {
  id: number
  date: string
  ownerStatus: string
  slots: string
  startTime: string
  endTime: string
  source: string
  createdAt: string
  updatedAt: string
}

interface TicketRequest {
  id: number
  date: string
  requesterName: string
  requesterContact: string
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  duration: string
  startTime: string | null
  slots: string | null
  createdAt: string
  updatedAt: string
}

export const useScheduleStore = defineStore('schedule', () => {
  const auth = useAuthStore()

  const ownerDates = ref<Schedule[]>([])
  const requests = ref<TicketRequest[]>([])
  const loading = ref(false)

  const ownerDateSet = computed(() => new Set(ownerDates.value.map((d) => d.date)))

  const pendingRequests = computed(() => requests.value.filter((r) => r.status === 'pending'))
  const approvedRequests = computed(() => requests.value.filter((r) => r.status === 'approved'))

  async function fetchSchedules() {
    ownerDates.value = await $fetch<Schedule[]>('/api/schedule')
  }

  async function fetchRequests() {
    requests.value = await $fetch<TicketRequest[]>('/api/requests')
  }

  async function addOwnerDates(dates: Array<{ date: string, startTime: string, endTime: string }>) {
    await $fetch('/api/schedule', {
      method: 'POST',
      body: { dates },
      headers: { 'x-admin-pin': auth.pin },
    })
    await fetchSchedules()
  }

  async function syncPlanday() {
    const result = await $fetch<{ success: boolean; synced: number; removed: number }>('/api/schedule/sync', {
      method: 'POST',
      headers: { 'x-admin-pin': auth.pin },
    })
    await fetchSchedules()
    return result
  }

  async function removeOwnerDate(date: string) {
    await $fetch(`/api/schedule/${date}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': auth.pin },
    })
    await fetchSchedules()
  }

  async function submitRequest(data: {
    date: string
    requesterName: string
    requesterContact: string
    note?: string
    duration?: Duration
    startTime?: string
  }) {
    const result = await $fetch('/api/requests', {
      method: 'POST',
      body: data,
    })
    await fetchRequests()
    return result
  }

  async function updateRequestStatus(id: number, status: 'approved' | 'rejected') {
    await $fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      body: { status },
      headers: { 'x-admin-pin': auth.pin },
    })
    await fetchRequests()
  }

  async function deleteRequest(id: number) {
    await $fetch(`/api/requests/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': auth.pin },
    })
    await fetchRequests()
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
    loading,
    ownerDateSet,
    pendingRequests,
    approvedRequests,
    fetchSchedules,
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
