<script setup lang="ts">
const auth = useAuthStore()

onMounted(async () => {
  await auth.fetchSession()
  if (auth.isAuthenticated) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center mt-16 space-y-6 text-center">
    <h1 class="text-3xl font-bold">Train Ticket Scheduler</h1>
    <p class="text-gray-600 dark:text-gray-400 max-w-md">
      Manage your train ticket availability and let others request dates when you're not using it.
    </p>
    <div class="flex gap-3">
      <UButton label="Log in" to="/login" size="lg" />
    </div>
  </div>
</template>
