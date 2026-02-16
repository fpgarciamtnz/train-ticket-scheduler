export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // Hydrate session on first load
  if (auth.user === null && !auth.isAuthenticated) {
    await auth.fetchSession()
  }

  if (to.path === '/login') {
    if (auth.isAuthenticated) {
      return navigateTo('/dashboard')
    }
  }

  if (to.path.startsWith('/dashboard')) {
    if (!auth.isAuthenticated) {
      return navigateTo('/login')
    }
  }
})
