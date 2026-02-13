export const useAuthStore = defineStore('auth', () => {
  const pin = ref('')
  const isAuthenticated = ref(false)

  function login(inputPin: string) {
    pin.value = inputPin
    isAuthenticated.value = true
  }

  function logout() {
    pin.value = ''
    isAuthenticated.value = false
  }

  return { pin, isAuthenticated, login, logout }
})
