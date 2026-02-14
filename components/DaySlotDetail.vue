<script setup lang="ts">
import { format } from 'date-fns'
import { TIME_SLOTS, SLOT_LABELS, SLOT_ICONS, parseSlots, type TimeSlot } from '~/utils/slots'

const props = defineProps<{
  date: string
}>()

const schedule = useScheduleStore()

const ownerSlots = computed(() => schedule.getOwnerSlotsForDate(props.date))

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
  </UCard>
</template>
