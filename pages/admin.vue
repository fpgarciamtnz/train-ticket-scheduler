<script setup lang="ts">
import { format } from 'date-fns'
import { formatTime, formatTimeRange, isFullDay } from '~/utils/slots'

const auth = useAuthStore()
const schedule = useScheduleStore()

const pinInput = ref('')
const pinError = ref('')

// Schedule management — multi-date calendar selection
const selectedDates = ref<Set<string>>(new Set())
const startTime = ref('06:00')
const endTime = ref('24:00')
const fullDay = ref(true)
const saving = ref(false)

// --- Preset time ranges (localStorage-backed) ---
interface TimePreset {
  label: string
  startTime: string
  endTime: string
}

const PRESETS_KEY = 'schedule-presets'
const DEFAULT_PRESETS: TimePreset[] = [
  { label: 'Full day', startTime: '06:00', endTime: '24:00' },
  { label: 'Morning', startTime: '06:00', endTime: '12:00' },
  { label: 'Afternoon', startTime: '12:00', endTime: '18:00' },
]

function loadPresets(): TimePreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function savePresets() {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.value))
}

const presets = ref<TimePreset[]>([])
const showPresetForm = ref(false)
const newPresetLabel = ref('')

onMounted(() => {
  const stored = loadPresets()
  if (stored.length > 0) {
    presets.value = stored
  } else {
    presets.value = [...DEFAULT_PRESETS]
    savePresets()
  }
})

function applyPreset(preset: TimePreset) {
  startTime.value = preset.startTime
  endTime.value = preset.endTime
  fullDay.value = isFullDay(preset.startTime, preset.endTime)
}

function addPreset() {
  const label = newPresetLabel.value.trim()
  if (!label) return
  presets.value.push({ label, startTime: startTime.value, endTime: endTime.value })
  savePresets()
  newPresetLabel.value = ''
  showPresetForm.value = false
}

function deletePreset(index: number) {
  presets.value.splice(index, 1)
  savePresets()
}

// Hour-only options for time dropdowns (0:00 – 24:00)
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const value = `${String(i).padStart(2, '0')}:00`
  return { label: formatTime(value), value }
})

// Planday sync
const syncing = ref(false)
const syncResult = ref('')

async function syncFromPlanday() {
  syncing.value = true
  syncResult.value = ''
  try {
    const result = await schedule.syncPlanday()
    syncResult.value = `Synced ${result.synced} shift${result.synced === 1 ? '' : 's'}, removed ${result.removed} stale entr${result.removed === 1 ? 'y' : 'ies'}`
  } catch (e: any) {
    syncResult.value = `Sync failed: ${e.data?.message || e.message || 'Unknown error'}`
  } finally {
    syncing.value = false
  }
}

// Settings
const adminEmail = ref('')
const settingsLoading = ref(false)
const settingsSaved = ref(false)

async function loadSettings() {
  try {
    const data = await $fetch<Record<string, string>>('/api/settings', {
      headers: { 'x-admin-pin': auth.pin },
    })
    adminEmail.value = data.admin_email || ''
  } catch {
    // Settings may not exist yet
  }
}

async function saveAdminEmail() {
  settingsLoading.value = true
  settingsSaved.value = false
  try {
    await $fetch('/api/settings', {
      method: 'POST',
      body: { key: 'admin_email', value: adminEmail.value },
      headers: { 'x-admin-pin': auth.pin },
    })
    settingsSaved.value = true
  } finally {
    settingsLoading.value = false
  }
}

// Request management
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'requesterName', label: 'Name' },
  { key: 'requesterContact', label: 'Contact' },
  { key: 'duration', label: 'Duration' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'status', label: 'Status' },
  { key: 'note', label: 'Note' },
  { key: 'actions', label: 'Actions' },
]

const tabItems = [
  { label: 'Schedule', slot: 'schedule', icon: 'i-heroicons-calendar-days' },
  { label: 'Requests', slot: 'requests', icon: 'i-heroicons-inbox' },
  { label: 'Settings', slot: 'settings', icon: 'i-heroicons-cog-6-tooth' },
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
  await Promise.all([schedule.fetchSchedules(), schedule.fetchRequests(), loadSettings()])
  // Fire-and-forget auto-sync from Planday
  syncFromPlanday()
}

// Calendar attributes: blue for selected (unsaved), red for saved
const calendarAttributes = computed(() => {
  const attrs: any[] = []

  // Blue highlight for currently-selected unsaved dates
  for (const dateStr of selectedDates.value) {
    attrs.push({
      key: `selected-${dateStr}`,
      highlight: { color: 'blue', fillMode: 'solid' },
      dates: new Date(dateStr + 'T00:00:00'),
    })
  }

  // Red highlight for already-saved schedule dates
  for (const s of schedule.ownerDates) {
    // Don't show red if it's also selected (blue takes priority)
    if (selectedDates.value.has(s.date)) continue
    const full = isFullDay(s.startTime, s.endTime)
    attrs.push({
      key: `owner-${s.date}`,
      highlight: { color: 'red', fillMode: full ? 'solid' : 'outline' },
      dates: new Date(s.date + 'T00:00:00'),
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

function onDayClick(day: any) {
  const dateStr = format(day.date, 'yyyy-MM-dd')
  const next = new Set(selectedDates.value)
  if (next.has(dateStr)) {
    next.delete(dateStr)
  } else {
    next.add(dateStr)
  }
  selectedDates.value = next
}

watch(fullDay, (val) => {
  if (val) {
    startTime.value = '06:00'
    endTime.value = '24:00'
  }
})

watch([startTime, endTime], () => {
  if (fullDay.value && !isFullDay(startTime.value, endTime.value)) {
    fullDay.value = false
  }
})

async function saveForSelectedDates() {
  if (selectedDates.value.size === 0) return
  saving.value = true
  try {
    const dates = [...selectedDates.value].map(date => ({
      date,
      startTime: startTime.value,
      endTime: endTime.value,
    }))
    await schedule.addOwnerDates(dates)
    selectedDates.value = new Set()
  } finally {
    saving.value = false
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
            <!-- Planday sync -->
            <div class="flex items-center gap-3">
              <UButton
                icon="i-heroicons-arrow-path"
                label="Sync from Planday"
                :loading="syncing"
                variant="soft"
                color="violet"
                @click="syncFromPlanday"
              />
              <span v-if="syncResult" class="text-sm text-gray-600 dark:text-gray-400">{{ syncResult }}</span>
            </div>

            <!-- Calendar for multi-date selection -->
            <div>
              <h3 class="font-medium mb-2 text-gray-900 dark:text-gray-100">Click dates on the calendar to select them</h3>
              <ClientOnly>
                <VCalendar
                  :attributes="calendarAttributes"
                  :is-dark="{ selector: 'html', darkClass: 'dark' }"
                  :first-day-of-week="2"
                  expanded
                  borderless
                  transparent
                  title-position="left"
                  @dayclick="onDayClick"
                />
                <template #fallback>
                  <div class="h-80 flex items-center justify-center">
                    <p class="text-gray-500 dark:text-gray-400">Loading calendar...</p>
                  </div>
                </template>
              </ClientOnly>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Blue = selected (unsaved) &middot; Red = scheduled
              </p>
            </div>

            <!-- Time range pickers -->
            <div>
              <h3 class="font-medium mb-2 text-gray-900 dark:text-gray-100">Time range for selected dates</h3>

              <div class="flex items-center gap-2 mb-3">
                <UCheckbox v-model="fullDay" label="Full day (06:00 - 24:00)" />
              </div>

              <!-- Preset chips -->
              <div v-if="presets.length" class="flex flex-wrap gap-2 mb-3">
                <div v-for="(preset, idx) in presets" :key="idx" class="flex items-center gap-0.5">
                  <UButton
                    size="xs"
                    variant="soft"
                    :label="`${preset.label} (${formatTimeRange(preset.startTime, preset.endTime)})`"
                    @click="applyPreset(preset)"
                  />
                  <UButton
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    size="2xs"
                    @click="deletePreset(idx)"
                  />
                </div>
              </div>

              <div v-if="!fullDay" class="flex flex-col sm:flex-row gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Start Time</label>
                  <USelect v-model="startTime" :options="HOUR_OPTIONS" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">End Time</label>
                  <USelect v-model="endTime" :options="HOUR_OPTIONS" />
                </div>
              </div>

              <!-- Save as preset -->
              <div class="mt-2">
                <UButton
                  v-if="!showPresetForm"
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-bookmark"
                  label="Save as preset"
                  @click="showPresetForm = true"
                />
                <div v-else class="flex items-center gap-2">
                  <UInput
                    v-model="newPresetLabel"
                    size="xs"
                    placeholder="Preset name"
                    class="w-40"
                    @keyup.enter="addPreset"
                  />
                  <UButton size="xs" label="Save" @click="addPreset" />
                  <UButton size="xs" variant="ghost" label="Cancel" @click="showPresetForm = false" />
                </div>
              </div>

              <div class="mt-3">
                <UButton
                  :label="`Save for ${selectedDates.size} selected date${selectedDates.size === 1 ? '' : 's'}`"
                  :loading="saving"
                  :disabled="selectedDates.size === 0"
                  @click="saveForSelectedDates"
                />
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
                    <UBadge color="red" variant="subtle" size="xs">
                      {{ formatTimeRange(entry.startTime, entry.endTime) }}
                    </UBadge>
                    <UBadge v-if="entry.source === 'planday'" color="violet" variant="subtle" size="xs">
                      Planday
                    </UBadge>
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
              <template #startTime-data="{ row }">
                <span class="text-sm">{{ row.startTime || '—' }}</span>
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

        <template #settings>
          <div class="pt-4 max-w-md space-y-4">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h3>
            <div>
              <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Admin Email</label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Receives notifications when new requests are submitted and reminders before approved requests.</p>
              <div class="flex gap-2">
                <UInput v-model="adminEmail" type="email" placeholder="admin@example.com" class="flex-1" />
                <UButton label="Save" :loading="settingsLoading" @click="saveAdminEmail" />
              </div>
              <p v-if="settingsSaved" class="text-green-500 text-sm mt-1">Saved!</p>
            </div>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
