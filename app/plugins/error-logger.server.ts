const sanitizeServerError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    }
  }

  return {
    message: 'Unknown server error',
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const logError = (error: unknown, context: Record<string, unknown> = {}) => {
    console.error('[app-error:server]', {
      ...context,
      ...sanitizeServerError(error),
    })
  }

  nuxtApp.hook('app:error', (error) => {
    logError(error, {
      source: 'nuxt-app',
      url: nuxtApp.ssrContext?.event?.path,
    })
  })

  return {
    provide: {
      errorLogger: logError,
    },
  }
})
