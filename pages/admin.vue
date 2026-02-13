<script setup lang="ts">
import { format } from 'date-fns'

const auth = useAuthStore()
const schedule = useScheduleStore()

const pinInput = ref('')
const pinError = ref('')

// Schedule management
const selectedDates = ref<Date[]>([])
const savingDates = ref(false)

// Request management
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'requesterName', label: 'Name' },
  { key: 'requesterContact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'note', label: 'Note' },
  { key: 'actions', label: 'Actions' },
]

const tabItems = [
  { label: 'Schedule', slot: 'schedule', icon: 'i-heroicons-calendar-days' },
  { label: 'Requests', slot: 'requests', icon: 'i-heroicons-inbox' },
]

async function submitPin() {
  if (!pinInput.value) return
  auth.login(pinInput.value)
  try {
    await Promise.all([schedule.fetchSchedules(), schedule.fetchRequests()])
    pinError.value = ''
  } catch {
    auth.logout()
    pinError.value = 'Invalid PIN'
    pinInput.value = ''
  }
}

async function saveDates() {
  if (selectedDates.value.length === 0) return
  savingDates.value = true
  try {
    const dates = selectedDates.value.map((d) => format(d, 'yyyy-MM-dd'))
    await schedule.addOwnerDates(dates)
    selectedDates.value = []
  } finally {
    savingDates.value = false
  }
}

async function removeDateEntry(date: string) {
  await schedule.removeOwnerDate(date)
}

async function approveRequest(id: number) {
  await schedule.updateRequestStatus(id, 'approved')
}

async function rejectRequest(id: number) {
  await schedule.updateRequestStatus(id, 'rejected')
}

async function deleteRequest(id: number) {
  await schedule.deleteRequest(id)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Admin Panel</h1>

    <!-- PIN Gate -->
    <div v-if="!auth.isAuthenticated" class="max-w-sm mx-auto text-center space-y-4">
      <p class="text-gray-600 dark:text-gray-400">Enter your admin PIN to continue</p>
      <form class="flex gap-2 justify-center" @submit.prevent="submitPin">
        <UInput
          v-model="pinInput"
          type="password"
          placeholder="Enter PIN"
          class="w-40"
        />
        <UButton type="submit" label="Login" />
      </form>
      <p v-if="pinError" class="text-red-500 text-sm">{{ pinError }}</p>
    </div>

    <!-- Admin Content -->
    <div v-else>
      <div class="flex justify-end mb-4">
        <UButton label="Logout" icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" size="sm" @click="auth.logout()" />
      </div>

      <UTabs :items="tabItems">
        <template #schedule>
          <div class="space-y-6 pt-4">
            <div>
              <h3 class="font-medium mb-2">Mark dates you're using the ticket</h3>
              <ClientOnly>
                <VDatePicker
                  v-model="selectedDates"
                  :min-date="new Date()"
                  mode="date"
                  expanded
                />
              </ClientOnly>
              <div class="mt-3 flex gap-2">
                <UButton
                  label="Save Selected Dates"
                  :loading="savingDates"
                  :disabled="selectedDates.length === 0"
                  @click="saveDates"
                />
              </div>
            </div>

            <div>
              <h3 class="font-medium mb-2">Your scheduled dates</h3>
              <div v-if="schedule.ownerDates.length === 0" class="text-gray-500 text-sm">
                No dates scheduled yet.
              </div>
              <div v-else class="space-y-1">
                <div
                  v-for="entry in schedule.ownerDates"
                  :key="entry.id"
                  class="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span class="text-sm">{{ entry.date }}</span>
                  <UButton
                    icon="i-heroicons-trash"
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="removeDateEntry(entry.date)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #requests>
          <div class="pt-4">
            <UTable :rows="schedule.requests" :columns="columns">
              <template #status-data="{ row }">
                <StatusBadge :status="row.status" />
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-1">
                  <UButton
                    v-if="row.status === 'pending'"
                    icon="i-heroicons-check"
                    color="green"
                    variant="ghost"
                    size="xs"
                    @click="approveRequest(row.id)"
                  />
                  <UButton
                    v-if="row.status === 'pending'"
                    icon="i-heroicons-x-mark"
                    color="yellow"
                    variant="ghost"
                    size="xs"
                    @click="rejectRequest(row.id)"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="deleteRequest(row.id)"
                  />
                </div>
              </template>
            </UTable>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
