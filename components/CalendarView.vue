<script setup lang="ts">
const { attributes } = useCalendarAttributes()
</script>

<template>
  <ClientOnly>
    <VCalendar
      :attributes="attributes"
      :is-dark="{ selector: 'html', darkClass: 'dark' }"
      expanded
      borderless
      transparent
      title-position="left"
    />
    <template #fallback>
      <div class="h-80 flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">Loading calendar...</p>
      </div>
    </template>
  </ClientOnly>
</template>
