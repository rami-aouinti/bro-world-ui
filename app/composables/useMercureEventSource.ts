import { onBeforeUnmount, watch, type Ref } from 'vue'

export const useMercureEventSource = (topics: Ref<string[]>, onMessage: (payload: unknown) => void) => {
  const config = useRuntimeConfig()
  const eventSource = ref<EventSource | null>(null)

  const close = () => {
    if (!eventSource.value) {
      return
    }

    eventSource.value.close()
    eventSource.value = null
  }

  const connect = () => {
    if (!import.meta.client) {
      return
    }

    const topicValues = topics.value.filter(Boolean)

    if (!topicValues.length) {
      close()
      return
    }

    const url = new URL(config.public.mercurePublicUrl)
    topicValues.forEach(topic => url.searchParams.append('topic', topic))

    close()

    const source = new EventSource(url.toString(), { withCredentials: false })
    source.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data))
      }
      catch {
        onMessage(event.data)
      }
    }

    source.onerror = () => {
      // Browser EventSource handles automatic reconnection.
    }

    eventSource.value = source
  }

  watch(topics, connect, { immediate: true })
  onBeforeUnmount(close)

  return { close, reconnect: connect }
}
