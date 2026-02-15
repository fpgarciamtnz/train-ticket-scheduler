<script setup lang="ts">
import { format } from 'date-fns'
import { isFullDay, DURATION_OPTIONS, type Duration } from '~/utils/slots'

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
const startTime = ref('')
const submitting = ref(false)
const error = ref('')

const disabledDates = computed(() =>
  schedule.ownerDates
    .filter(d => isFullDay(d.startTime, d.endTime))
    .map((d) => new Date(d.date + 'T00:00:00')),
)

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
      startTime: startTime.value || undefined,
    })
    selectedDate.value = null
    requesterName.value = ''
    requesterContact.value = ''
    note.value = ''
    duration.value = '8h'
    startTime.value = ''
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

        <div>
          <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Preferred Start Time (optional)</label>
          <UInput v-model="startTime" placeholder="e.g. 9:00 AM" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Use AM/PM format (e.g. 9:00 AM, 2:30 PM)</p>
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
