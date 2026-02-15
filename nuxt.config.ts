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
    adminPin: '3489',
    plandayClientId: '',
    plandayRefreshToken: '',
    plandayEmployeeId: '',
    resendApiKey: '',
    resendFromEmail: '',
  },
})
