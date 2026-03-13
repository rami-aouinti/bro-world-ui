declare module '#app' {
  interface NuxtApp {
    $errorLogger: (error: unknown, context?: Record<string, unknown>) => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $errorLogger: (error: unknown, context?: Record<string, unknown>) => void
  }
}

export {}
