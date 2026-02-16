interface AuthUser {
  id: number
  email: string
  name: string
  slug: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchSession() {
    try {
      const data = await $fetch<AuthUser | null>('/api/auth/session')
      user.value = data
    } catch {
      user.value = null
    }
  }

  async function login(email: string, pin: string): Promise<AuthUser> {
    const data = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { email, pin },
    })
    user.value = data
    return data
  }

  async function register(name: string, email: string, pin: string): Promise<AuthUser> {
    const data = await $fetch<AuthUser>('/api/auth/register', {
      method: 'POST',
      body: { name, email, pin },
    })
    user.value = data
    return data
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, isAuthenticated, fetchSession, login, register, logout }
})
