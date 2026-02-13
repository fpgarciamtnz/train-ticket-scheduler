<script setup lang="ts">
const colorMode = useColorMode()

const navLinks = [
  { label: 'Calendar', icon: 'i-heroicons-calendar-days', to: '/' },
  { label: 'Request', icon: 'i-heroicons-paper-airplane', to: '/request' },
  { label: 'Admin', icon: 'i-heroicons-shield-check', to: '/admin' },
]

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-lg font-bold">Train Ticket</NuxtLink>
          <nav class="flex gap-2">
            <UButton
              v-for="link in navLinks"
              :key="link.label"
              :to="link.to"
              :icon="link.icon"
              :label="link.label"
              variant="ghost"
              size="sm"
            />
          </nav>
        </div>
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          variant="ghost"
          size="sm"
          @click="toggleColorMode"
        />
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
      <slot />
    </main>

    <footer class="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-sm text-gray-500">
      Train Ticket Scheduler
    </footer>
  </div>
</template>
