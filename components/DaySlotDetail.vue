<script setup lang="ts">
import { format } from 'date-fns'
import { TIME_SLOTS, SLOT_LABELS, SLOT_ICONS, DURATION_OPTIONS, type TimeSlot, type Duration } from '~/utils/slots'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const schedule = useScheduleStore()

const ownerSlots = computed(() => schedule.getOwnerSlotsForDate(props.date))

const hasAvailableSlot = computed(() => ownerSlots.value.length < TIME_SLOTS.length)

function getSlotStatus(slot: TimeSlot) {
  if (ownerSlots.value.includes(slot)) {
    return { label: 'Owner using', color: 'red' }
  }

  const pending = schedule.pendingRequests.find(
    r => r.date === props.date && r.slots?.split(',').includes(slot),
  )
  if (pending) {
    return { label: 'Pending', color: 'yellow' }
  }

  const approved = schedule.approvedRequests.find(
    r => r.date === props.date && r.slots?.split(',').includes(slot),
  )
  if (approved) {
    return { label: 'Approved', color: 'blue' }
  }

  return { label: 'Available', color: 'green' }
}

const formattedDate = computed(() => {
  return format(new Date(props.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
})

// Inline request form state
const showForm = ref(false)
const requesterName = ref('')
const requesterContact = ref('')
const note = ref('')
const duration = ref<Duration>('8h')
const submitting = ref(false)
const error = ref('')
const success = ref(false)

watch(() => props.date, () => {
  showForm.value = false
  success.value = false
  error.value = ''
  resetForm()
})

function resetForm() {
  requesterName.value = ''
  requesterContact.value = ''
  note.value = ''
  duration.value = '8h'
}

async function submit() {
  if (!requesterName.value || !requesterContact.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  error.value = ''
  submitting.value = true

  try {
    await schedule.submitRequest({
      date: props.date,
      requesterName: requesterName.value,
      requesterContact: requesterContact.value,
      note: note.value || undefined,
      duration: duration.value,
    })
    success.value = true
    showForm.value = false
    resetForm()
    emit('submitted')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to submit request'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-primary" />
        <h3 class="font-semibold text-sm">{{ formattedDate }}</h3>
      </div>
    </template>

    <div class="space-y-2">
      <div
        v-for="slot in TIME_SLOTS"
        :key="slot"
        class="flex items-center justify-between p-3 rounded-lg"
        :class="{
          'bg-red-50 dark:bg-red-950/30': getSlotStatus(slot).color === 'red',
          'bg-yellow-50 dark:bg-yellow-950/30': getSlotStatus(slot).color === 'yellow',
          'bg-blue-50 dark:bg-blue-950/30': getSlotStatus(slot).color === 'blue',
          'bg-green-50 dark:bg-green-950/30': getSlotStatus(slot).color === 'green',
        }"
      >
        <div class="flex items-center gap-3">
          <UIcon :name="SLOT_ICONS[slot]" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ SLOT_LABELS[slot] }}</span>
        </div>
        <UBadge :color="getSlotStatus(slot).color" variant="subtle" size="sm">
          {{ getSlotStatus(slot).label }}
        </UBadge>
      </div>
    </div>

    <!-- Success message -->
    <div v-if="success" class="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center gap-2">
      <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
      <span class="text-sm text-green-700 dark:text-green-300">Request submitted! The ticket owner will review it.</span>
    </div>

    <!-- Request button / form -->
    <div v-if="hasAvailableSlot && !success" class="mt-4">
      <UButton
        v-if="!showForm"
        label="Request this Date"
        icon="i-heroicons-plus"
        variant="outline"
        block
        @click="showForm = true"
      />

      <form v-else class="space-y-4" @submit.prevent="submit">
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
          <UTextarea v-model="note" placeholder="Any additional details" />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <div class="flex gap-2">
          <UButton type="submit" label="Submit Request" :loading="submitting" class="flex-1" />
          <UButton label="Cancel" variant="ghost" color="gray" @click="showForm = false" />
        </div>
      </form>
    </div>
  </UCard>
</template>
