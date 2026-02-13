declare module 'h3' {
  interface H3EventContext {
    cf: CfProperties
    cloudflare: {
      env: {
        DB: D1Database
      }
    }
  }
}

export {}
