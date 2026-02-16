<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const pin = ref('')
const confirmPin = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true

  try {
    if (mode.value === 'register') {
      if (!name.value.trim()) {
        error.value = 'Name is required'
        return
      }
      if (pin.value !== confirmPin.value) {
        error.value = 'PINs do not match'
        return
      }
      await auth.register(name.value.trim(), email.value, pin.value)
    } else {
      await auth.login(email.value, pin.value)
    }
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto mt-12">
    <h1 class="text-2xl font-bold mb-6 text-center">
      {{ mode === 'login' ? 'Owner Login' : 'Create Owner Account' }}
    </h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div v-if="mode === 'register'">
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Name</label>
        <UInput v-model="name" placeholder="Your name" required />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Email</label>
        <UInput v-model="email" type="email" placeholder="you@example.com" required />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">PIN</label>
        <UInput
          v-model="pin"
          type="password"
          inputmode="numeric"
          maxlength="4"
          placeholder="4-digit PIN"
          required
        />
      </div>

      <div v-if="mode === 'register'">
        <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Confirm PIN</label>
        <UInput
          v-model="confirmPin"
          type="password"
          inputmode="numeric"
          maxlength="4"
          placeholder="Repeat PIN"
          required
        />
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <UButton
        type="submit"
        :label="mode === 'login' ? 'Log in' : 'Create Account'"
        block
        :loading="loading"
      />
    </form>

    <p class="text-center text-sm mt-4 text-gray-500 dark:text-gray-400">
      <template v-if="mode === 'login'">
        Don't have an account?
        <UButton variant="link" label="Register" size="sm" @click="mode = 'register'; error = ''" />
      </template>
      <template v-else>
        Already have an account?
        <UButton variant="link" label="Log in" size="sm" @click="mode = 'login'; error = ''" />
      </template>
    </p>
  </div>
</template>
