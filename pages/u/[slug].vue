<script setup lang="ts">
import { formatZones, parseZoneLabels, formatZoneWithLabel, type Zone } from '~/utils/zones'

const route = useRoute()
const schedule = useScheduleStore()

const slug = route.params.slug as string
const calendarUser = ref<{ id: number; name: string; slug: string; ticket: { zones: string; zoneLabels: string; activationDate: string; finishDate: string } | null } | null>(null)
const notFound = ref(false)
const showRequestModal = ref(false)

try {
  const user = await $fetch<{ id: number; name: string; slug: string; ticket: { zones: string; zoneLabels: string; activationDate: string; finishDate: string } | null }>('/api/users/by-slug', {
    query: { slug },
  })
  calendarUser.value = user
} catch {
  notFound.value = true
}

if (calendarUser.value) {
  await useAsyncData(`schedule-${calendarUser.value.id}`, () => Promise.all([
    schedule.fetchSchedules(calendarUser.value!.id),
    schedule.fetchRequests(calendarUser.value!.id),
  ]))
}
</script>

<template>
  <div>
    <div v-if="notFound" class="text-center mt-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-yellow-500" />
      <h1 class="text-2xl font-bold mt-4">User not found</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">This calendar doesn't exist.</p>
      <UButton label="Go Home" to="/" variant="outline" class="mt-4" />
    </div>

    <div v-else-if="calendarUser">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">{{ calendarUser.name }}'s Ticket Calendar</h1>
        <UButton label="Request a Date" icon="i-heroicons-plus" @click="showRequestModal = true" />
      </div>

      <div v-if="calendarUser.ticket" class="mb-6 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <UBadge v-for="z in formatZones(calendarUser.ticket.zones).split(', ')" :key="z" color="primary" variant="subtle" size="sm">
          Zone {{ formatZoneWithLabel(z as Zone, parseZoneLabels(calendarUser.ticket.zoneLabels)) }}
        </UBadge>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Valid {{ calendarUser.ticket.activationDate }} &mdash; {{ calendarUser.ticket.finishDate }}
        </span>
      </div>

      <div class="grid md:grid-cols-[1fr_280px] gap-6">
        <CalendarView :user-id="calendarUser.id" @submitted="schedule.fetchRequests(calendarUser!.id)" />

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

      <RequestModal v-model="showRequestModal" :user-id="calendarUser.id" @submitted="schedule.fetchRequests(calendarUser!.id)" />
    </div>
  </div>
</template>
