export default defineNuxtPlugin((nuxtApp) => {
  const tracker = useTracker()

  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    tracker.trackError('error.vue.global', error, {
      info,
      component: instance?.$options?.name ?? 'anonymous-component',
    })
  }

  nuxtApp.hook('vue:error', (error, instance, info) => {
    tracker.trackError('error.vue.hook', error, {
      info,
      component: instance?.$options?.name ?? 'anonymous-component',
    })
  })

  nuxtApp.hook('app:error', (error) => {
    tracker.trackError('error.nuxt.app', error)
  })
})
