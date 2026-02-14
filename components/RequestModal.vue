<script setup lang="ts">
import { format } from 'date-fns'
import { TIME_SLOTS, DURATION_OPTIONS, SLOT_LABELS, SLOT_ICONS, serializeSlots, type TimeSlot, type Duration } from '~/utils/slots'

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  submitted: []
}>()

const schedule = useScheduleStore()

const selectedDate = ref<Date | null>(null)
const requesterName = ref('')
const requesterContact = ref('')
const note = ref('')
const duration = ref<Duration>('8h')
const selectedSlots = ref<TimeSlot[]>([])
const submitting = ref(false)
const error = ref('')

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
    selectedDate.value = null
    requesterName.value = ''
    requesterContact.value = ''
    note.value = ''
    duration.value = '8h'
    selectedSlots.value = []
    emit('submitted')
    modelValue.value = false
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to submit request'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model="modelValue">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Request a Date</h3>
      </template>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Select a Date</label>
          <ClientOnly>
            <VDatePicker
              v-model="selectedDate"
              :disabled-dates="disabledDates"
              :min-date="new Date()"
              :is-dark="{ selector: 'html', darkClass: 'dark' }"
              mode="date"
            />
          </ClientOnly>
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
          <UInput v-model="requesterContact" placeholder="Email or phone" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Note (optional)</label>
          <UTextarea v-model="note" placeholder="Any additional details" />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="outline" label="Cancel" @click="modelValue = false" />
          <UButton type="submit" label="Submit Request" :loading="submitting" />
        </div>
      </form>
    </UCard>
  </UModal>
</template>
