<script setup lang="ts">
import { TIME_SLOTS, SLOT_LABELS, SLOT_ICONS, parseSlots, serializeSlots, type TimeSlot } from '~/utils/slots'

const auth = useAuthStore()
const schedule = useScheduleStore()

const pinInput = ref('')
const pinError = ref('')

// Schedule management
const selectedDate = ref('')
const selectedSlots = ref<TimeSlot[]>([])
const savingSlots = ref(false)

// Request management
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'requesterName', label: 'Name' },
  { key: 'requesterContact', label: 'Contact' },
  { key: 'duration', label: 'Duration' },
  { key: 'slots', label: 'Slots' },
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
  pinError.value = ''
  const valid = await auth.verify(pinInput.value)
  if (!valid) {
    pinError.value = 'Invalid PIN'
    pinInput.value = ''
    return
  }
  auth.login(pinInput.value)
  await Promise.all([schedule.fetchSchedules(), schedule.fetchRequests()])
}

function loadSlotsForDate() {
  if (!selectedDate.value) {
    selectedSlots.value = []
    return
  }
  selectedSlots.value = [...schedule.getOwnerSlotsForDate(selectedDate.value)]
}

watch(selectedDate, loadSlotsForDate)

function toggleSlot(slot: TimeSlot) {
  if (selectedSlots.value.includes(slot)) {
    selectedSlots.value = selectedSlots.value.filter(s => s !== slot)
  } else {
    selectedSlots.value.push(slot)
  }
}

async function saveSlots() {
  if (!selectedDate.value || selectedSlots.value.length === 0) return
  savingSlots.value = true
  try {
    await schedule.addOwnerDates([{
      date: selectedDate.value,
      slots: serializeSlots(selectedSlots.value),
    }])
  } finally {
    savingSlots.value = false
  }
}

async function clearDate() {
  if (!selectedDate.value) return
  await schedule.removeOwnerDate(selectedDate.value)
  selectedSlots.value = []
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

function formatSlotBadges(slots: string | null): string[] {
  if (!slots) return ['Full day']
  return parseSlots(slots).map(s => SLOT_LABELS[s].split(' (')[0])
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
            <!-- Single date picker + slot checkboxes -->
            <div>
              <h3 class="font-medium mb-2 text-gray-900 dark:text-gray-100">Select a date and choose which slots you're using</h3>
              <div class="flex flex-col sm:flex-row gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Date</label>
                  <UInput v-model="selectedDate" type="date" />
                </div>
              </div>

              <div v-if="selectedDate" class="mt-4">
                <p class="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Time Slots</p>
                <div class="space-y-1">
                  <label
                    v-for="slot in TIME_SLOTS"
                    :key="slot"
                    class="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors"
                    :class="selectedSlots.includes(slot)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'"
                    @click="toggleSlot(slot)"
                  >
                    <UCheckbox
                      :model-value="selectedSlots.includes(slot)"
                      @click.stop
                      @change="toggleSlot(slot)"
                    />
                    <UIcon :name="SLOT_ICONS[slot]" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ SLOT_LABELS[slot] }}</span>
                  </label>
                </div>

                <div class="mt-3 flex gap-2">
                  <UButton
                    label="Save Slots"
                    :loading="savingSlots"
                    :disabled="selectedSlots.length === 0"
                    @click="saveSlots"
                  />
                  <UButton
                    label="Clear All"
                    color="red"
                    variant="outline"
                    @click="clearDate"
                  />
                </div>
              </div>
            </div>

            <!-- Scheduled dates list -->
            <div>
              <h3 class="font-medium mb-2 text-gray-900 dark:text-gray-100">Your scheduled dates</h3>
              <div v-if="schedule.ownerDates.length === 0" class="text-gray-500 dark:text-gray-400 text-sm">
                No dates scheduled yet.
              </div>
              <div v-else class="space-y-1">
                <div
                  v-for="entry in schedule.ownerDates"
                  :key="entry.id"
                  class="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-mono text-gray-900 dark:text-gray-100">{{ entry.date }}</span>
                    <div class="flex gap-1">
                      <UBadge
                        v-for="slot in parseSlots(entry.slots)"
                        :key="slot"
                        color="red"
                        variant="subtle"
                        size="xs"
                      >
                        {{ SLOT_LABELS[slot].split(' (')[0] }}
                      </UBadge>
                    </div>
                  </div>
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
              <template #duration-data="{ row }">
                <UBadge color="gray" variant="subtle" size="sm">{{ row.duration || '8h' }}</UBadge>
              </template>
              <template #slots-data="{ row }">
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="s in formatSlotBadges(row.slots)"
                    :key="s"
                    color="blue"
                    variant="subtle"
                    size="xs"
                  >
                    {{ s }}
                  </UBadge>
                </div>
              </template>
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
