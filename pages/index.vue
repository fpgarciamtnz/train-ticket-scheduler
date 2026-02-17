<script setup lang="ts">
import { formatTimeRange, isFullDay } from '~/utils/slots'
import { formatZones, parseZoneLabels, formatZoneWithLabel, type Zone } from '~/utils/zones'

const { data: owners } = await useAsyncData('owners', () => $fetch('/api/owners'))

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div>
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold">Share My Skånetrafiken</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Browse ticket owners and their upcoming schedules.
      </p>
    </div>

    <div v-if="owners?.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="owner in owners" :key="owner.id">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold">{{ owner.name }}</h2>
            <div v-if="owner.ticket" class="mt-1 flex flex-wrap items-center gap-1">
              <UBadge v-for="z in formatZones(owner.ticket.zones).split(', ')" :key="z" color="primary" variant="subtle" size="xs">
                Zone {{ formatZoneWithLabel(z as Zone, parseZoneLabels(owner.ticket.zoneLabels)) }}
              </UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {{ owner.ticket.activationDate }} &mdash; {{ owner.ticket.finishDate }}
              </span>
            </div>
          </div>
        </template>

        <div v-if="owner.upcomingDates.length" class="space-y-2">
          <div
            v-for="(entry, i) in owner.upcomingDates.slice(0, 5)"
            :key="i"
            class="flex items-center justify-between text-sm"
          >
            <span>{{ formatDate(entry.date) }}</span>
            <UBadge
              :color="isFullDay(entry.startTime, entry.endTime) ? 'red' : 'orange'"
              variant="subtle"
              size="xs"
            >
              {{ isFullDay(entry.startTime, entry.endTime) ? 'Full day' : formatTimeRange(entry.startTime, entry.endTime) }}
            </UBadge>
          </div>
          <p v-if="owner.upcomingDates.length > 5" class="text-xs text-gray-500 dark:text-gray-400">
            +{{ owner.upcomingDates.length - 5 }} more dates
          </p>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          No upcoming dates
        </p>

        <template #footer>
          <UButton
            :to="`/u/${owner.slug}`"
            label="View Calendar"
            variant="outline"
            block
            icon="i-heroicons-calendar-days"
          />
        </template>
      </UCard>
    </div>

    <div v-else class="text-center mt-12 text-gray-500 dark:text-gray-400">
      <UIcon name="i-heroicons-users" class="text-4xl" />
      <p class="mt-2">No ticket owners found.</p>
    </div>
  </div>
</template>
