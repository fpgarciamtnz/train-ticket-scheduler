<script setup lang="ts">
import { format } from 'date-fns'
import { formatTime, formatTimeRange, isFullDay, DURATION_OPTIONS, type Duration } from '~/utils/slots'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const schedule = useScheduleStore()

const ownerRange = computed(() => schedule.getOwnerTimeRange(props.date))

const isFullyOccupied = computed(() => schedule.isDateFullyOccupied(props.date))

const formattedDate = computed(() => {
  return format(new Date(props.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
})

// Inline request form state
const showForm = ref(false)
const requesterName = ref('')
const requesterContact = ref('')
const note = ref('')
const duration = ref<Duration>('8h')
const startTime = ref('')
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
  startTime.value = ''
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
      startTime: startTime.value || undefined,
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
      <!-- Owner time range -->
      <div v-if="ownerRange" class="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-red-500" />
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Owner using: {{ formatTimeRange(ownerRange.startTime, ownerRange.endTime) }}
          </span>
        </div>
        <UBadge color="red" variant="subtle" size="sm">Occupied</UBadge>
      </div>

      <!-- Available windows (complement of owner range) -->
      <template v-if="ownerRange && !isFullyOccupied">
        <div v-if="ownerRange.startTime > '00:00'" class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-500" />
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Available: {{ formatTime('00:00') }} - {{ formatTime(ownerRange.startTime) }}
            </span>
          </div>
          <UBadge color="green" variant="subtle" size="sm">Open</UBadge>
        </div>
        <div v-if="ownerRange.endTime < '24:00'" class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-500" />
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Available: {{ formatTime(ownerRange.endTime) }} - {{ formatTime('24:00') }}
            </span>
          </div>
          <UBadge color="green" variant="subtle" size="sm">Open</UBadge>
        </div>
      </template>

      <!-- No schedule — fully open -->
      <div v-if="!ownerRange" class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-500" />
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Available: All day
          </span>
        </div>
        <UBadge color="green" variant="subtle" size="sm">Open</UBadge>
      </div>
    </div>

    <!-- Success message -->
    <div v-if="success" class="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center gap-2">
      <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
      <span class="text-sm text-green-700 dark:text-green-300">Request submitted! The ticket owner will review it.</span>
    </div>

    <!-- Request button / form -->
    <div v-if="!isFullyOccupied && !success" class="mt-4">
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
          <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Preferred Start Time (optional)</label>
          <UInput v-model="startTime" placeholder="e.g. 9:00 AM" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Use 24-hour format (e.g. 09:00, 14:30)</p>
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
