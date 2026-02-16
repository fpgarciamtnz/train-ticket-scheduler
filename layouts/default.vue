<script setup lang="ts">
const colorMode = useColorMode()
const auth = useAuthStore()

const navLinks = computed(() => {
  if (auth.isAuthenticated && auth.user) {
    return [
      { label: 'Dashboard', icon: 'i-heroicons-squares-2x2', to: '/dashboard' },
      { label: 'My Calendar', icon: 'i-heroicons-calendar-days', to: `/u/${auth.user.slug}` },
    ]
  }
  return [
    { label: 'Log in', icon: 'i-heroicons-arrow-right-on-rectangle', to: '/login' },
  ]
})

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function handleLogout() {
  await auth.logout()
  navigateTo('/')
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
            <UButton
              v-if="auth.isAuthenticated"
              icon="i-heroicons-arrow-right-on-rectangle"
              label="Logout"
              variant="ghost"
              size="sm"
              @click="handleLogout"
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

    <footer class="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      Train Ticket Scheduler
    </footer>
  </div>
</template>
