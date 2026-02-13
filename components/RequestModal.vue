<script setup lang="ts">
import { format } from 'date-fns'

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  submitted: []
}>()

const schedule = useScheduleStore()

const selectedDate = ref<Date | null>(null)
const requesterName = ref('')
const requesterContact = ref('')
const note = ref('')
const submitting = ref(false)
const error = ref('')

const disabledDates = computed(() =>
  schedule.ownerDates.map((d) => new Date(d.date + 'T00:00:00'))
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
    })
    selectedDate.value = null
    requesterName.value = ''
    requesterContact.value = ''
    note.value = ''
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
          <label class="block text-sm font-medium mb-1">Select a Date</label>
          <ClientOnly>
            <VDatePicker
              v-model="selectedDate"
              :disabled-dates="disabledDates"
              :min-date="new Date()"
              mode="date"
            />
          </ClientOnly>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Your Name *</label>
          <UInput v-model="requesterName" placeholder="Enter your name" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Contact Info *</label>
          <UInput v-model="requesterContact" placeholder="Email or phone" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Note (optional)</label>
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
