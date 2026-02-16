<script setup lang="ts">
const schedule = useScheduleStore()
const showRequestModal = ref(false)

await useAsyncData('schedule', () => Promise.all([
  schedule.fetchSchedules(),
  schedule.fetchRequests(),
]))
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Ticket Calendar</h1>
      <UButton label="Request a Date" icon="i-heroicons-plus" @click="showRequestModal = true" />
    </div>

    <div class="grid md:grid-cols-[1fr_280px] gap-6">
      <CalendarView @submitted="schedule.fetchRequests()" />

      <div class="space-y-3">
        <h2 class="font-semibold text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Legend</h2>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500" />
            <span>Owner using ticket (full day)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full border-2 border-red-500" />
            <span>Owner using ticket (partial day)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-yellow-400" />
            <span>Pending request</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500" />
            <span>Approved request</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full border-2 border-green-500" />
            <span>Today</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Click a date to see time-range availability</p>
      </div>
    </div>

    <RequestModal v-model="showRequestModal" @submitted="schedule.fetchRequests()" />
  </div>
</template>
