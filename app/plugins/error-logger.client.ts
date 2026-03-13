const sanitizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  return { message: 'Unknown client error' }
}

export default defineNuxtPlugin((nuxtApp) => {
  const logError = (error: unknown, context: Record<string, unknown> = {}) => {
    console.error('[app-error]', {
      ...context,
      ...sanitizeError(error),
    })
  }

  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    logError(error, {
      source: 'vue',
      info,
      component: instance?.$options?.name,
      route: nuxtApp.$router?.currentRoute.value.fullPath,
    })
  }

  nuxtApp.hook('app:error', (error) => {
    logError(error, {
      source: 'nuxt-app',
      route: nuxtApp.$router?.currentRoute.value.fullPath,
    })
  })

  return {
    provide: {
      errorLogger: logError,
    },
  }
})
