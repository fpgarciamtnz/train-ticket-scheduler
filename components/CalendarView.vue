<script setup lang="ts">
import { format } from 'date-fns'

const emit = defineEmits<{
  submitted: []
}>()

const { attributes } = useCalendarAttributes()
const selectedDate = ref<string | null>(null)

function onDayClick(day: any) {
  const dateStr = format(day.date, 'yyyy-MM-dd')
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}
</script>

<template>
  <div>
    <ClientOnly>
      <VCalendar
        :attributes="attributes"
        :is-dark="{ selector: 'html', darkClass: 'dark' }"
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

    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Click a date to see time-range availability
    </p>

    <div v-if="selectedDate" class="mt-4">
      <DaySlotDetail :date="selectedDate" @submitted="emit('submitted')" />
    </div>
  </div>
</template>
