// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@samk-dev/nuxt-vcalendar',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxthub/core',
    'nitro-cloudflare-dev',
    'nuxt-auth-utils',
  ],

  hub: {
    db: 'sqlite',
  },

  nitro: {
    preset: 'cloudflare-pages',
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    plandayClientId: '',
    plandayRefreshToken: '',
    plandayEmployeeId: '',
    resendApiKey: '',
    resendFromEmail: '',
  },
})
