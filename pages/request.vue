<script setup lang="ts">
import { format } from 'date-fns'
import { TIME_SLOTS, DURATION_OPTIONS, SLOT_LABELS, SLOT_ICONS, serializeSlots, type TimeSlot, type Duration } from '~/utils/slots'

const schedule = useScheduleStore()

await useAsyncData('schedule-for-request', () => schedule.fetchSchedules())

const selectedDate = ref<Date | null>(null)
const requesterName = ref('')
const requesterContact = ref('')
const note = ref('')
const duration = ref<Duration>('8h')
const selectedSlots = ref<TimeSlot[]>([])
const submitting = ref(false)
const error = ref('')
const success = ref(false)

const disabledDates = computed(() =>
  schedule.ownerDates
    .filter(d => d.slots === 'morning,midday,evening')
    .map((d) => new Date(d.date + 'T00:00:00')),
)

const availableSlots = computed(() => {
  if (!selectedDate.value) return [...TIME_SLOTS]
  const dateStr = format(selectedDate.value, 'yyyy-MM-dd')
  return schedule.getAvailableSlotsForDate(dateStr)
})

watch(selectedDate, () => {
  selectedSlots.value = selectedSlots.value.filter(s => availableSlots.value.includes(s))
})

function toggleSlot(slot: TimeSlot) {
  if (selectedSlots.value.includes(slot)) {
    selectedSlots.value = selectedSlots.value.filter(s => s !== slot)
  } else {
    selectedSlots.value.push(slot)
  }
}

async function submit() {
  if (!selectedDate.value || !requesterName.value || !requesterContact.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  error.value = ''
  submitting.value = true

  try {
    await schedule.submitRequest({
      date: format(selectedDate.value, 'yyyy-MM-dd'),
      requesterName: requesterName.value,
      requesterContact: requesterContact.value,
      note: note.value || undefined,
      duration: duration.value,
      slots: selectedSlots.value.length > 0 ? serializeSlots(selectedSlots.value) : undefined,
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to submit request'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  success.value = false
  selectedDate.value = null
  requesterName.value = ''
  requesterContact.value = ''
  note.value = ''
  duration.value = '8h'
  selectedSlots.value = []
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-6">Request a Date</h1>

    <div v-if="success" class="text-center space-y-4">
      <UIcon name="i-heroicons-check-circle" class="text-green-500 text-4xl" />
      <p class="text-lg font-medium">Request submitted!</p>
      <p class="text-gray-500 dark:text-gray-400">The ticket owner will review your request.</p>
      <div class="flex gap-2 justify-center">
        <UButton label="Back to Calendar" to="/" variant="outline" />
        <UButton label="Submit Another" @click="resetForm" />
      </div>
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Select a Date</label>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Red dates are unavailable (owner is using the ticket). Light red = partial day (some slots available).</p>
        <ClientOnly>
          <VDatePicker
            v-model="selectedDate"
            :disabled-dates="disabledDates"
            :min-date="new Date()"
            :is-dark="{ selector: 'html', darkClass: 'dark' }"
            mode="date"
            expanded
          />
        </ClientOnly>
        <p v-if="selectedDate" class="mt-2 text-sm">
          Selected: <strong>{{ format(selectedDate, 'MMMM d, yyyy') }}</strong>
        </p>
      </div>

      <!-- Duration -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Duration</label>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in DURATION_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :color="duration === opt.value ? 'primary' : 'gray'"
            :variant="duration === opt.value ? 'solid' : 'outline'"
            size="sm"
            @click="duration = opt.value as Duration"
          />
        </div>
      </div>

      <!-- Time Slots -->
      <div v-if="selectedDate">
        <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Time Slots</label>
        <div v-if="availableSlots.length === 0" class="text-sm text-red-500">
          No time slots available for this date.
        </div>
        <div v-else class="space-y-1">
          <label
            v-for="slot in availableSlots"
            :key="slot"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <UCheckbox
              :model-value="selectedSlots.includes(slot)"
              @change="toggleSlot(slot)"
            />
            <UIcon :name="SLOT_ICONS[slot]" class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-900 dark:text-gray-100">{{ SLOT_LABELS[slot] }}</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Your Name *</label>
        <UInput v-model="requesterName" placeholder="Enter your name" required />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Contact Info *</label>
        <UInput v-model="requesterContact" placeholder="Email or phone number" required />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Note (optional)</label>
        <UTextarea v-model="note" placeholder="Any additional details about your request" />
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <UButton type="submit" label="Submit Request" block :loading="submitting" />
    </form>
  </div>
</template>
