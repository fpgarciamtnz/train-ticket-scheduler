export const useAuthStore = defineStore('auth', () => {
  const pin = ref('')
  const isAuthenticated = ref(false)

  async function verify(inputPin: string): Promise<boolean> {
    try {
      await $fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'x-admin-pin': inputPin },
      })
      return true
    } catch {
      return false
    }
  }

  function login(inputPin: string) {
    pin.value = inputPin
    isAuthenticated.value = true
  }

  function logout() {
    pin.value = ''
    isAuthenticated.value = false
  }

  return { pin, isAuthenticated, verify, login, logout }
})
