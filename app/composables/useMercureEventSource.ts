import { computed, onBeforeUnmount, watch, type Ref } from 'vue'

type MercureMessageHandler = (payload: unknown) => void

type SubscriptionEntry = {
  topics: Set<string>
  handler: MercureMessageHandler
}

let mercureEventSource: EventSource | null = null
let activeTopicsKey = ''
let nextSubscriptionId = 0

const subscriptions = new Map<number, SubscriptionEntry>()

const getActiveTopics = () => {
  const topics = new Set<string>()

  subscriptions.forEach(({ topics: subscriptionTopics }) => {
    subscriptionTopics.forEach(topic => topics.add(topic))
  })

  return [...topics].sort((a, b) => a.localeCompare(b))
}

const closeEventSource = () => {
  if (!mercureEventSource) {
    return
  }

  mercureEventSource.close()
  mercureEventSource = null
  activeTopicsKey = ''
}

const connectEventSource = () => {
  if (!import.meta.client) {
    return
  }

  const config = useRuntimeConfig()
  const topics = getActiveTopics()
  const nextTopicsKey = topics.join('|')

  if (!topics.length) {
    closeEventSource()
    return
  }

  if (mercureEventSource && nextTopicsKey === activeTopicsKey) {
    return
  }

  closeEventSource()

  const url = new URL(config.public.mercurePublicUrl)
  topics.forEach(topic => url.searchParams.append('topic', topic))

  const source = new EventSource(url.toString(), { withCredentials: false })

  source.onmessage = (event) => {
    let payload: unknown = event.data

    try {
      payload = JSON.parse(event.data)
    }
    catch {
      payload = event.data
    }

    subscriptions.forEach(({ handler }) => {
      handler(payload)
    })
  }

  source.onerror = () => {
    // Browser EventSource handles automatic reconnection.
  }

  mercureEventSource = source
  activeTopicsKey = nextTopicsKey
}

const registerTopics = (subscriptionId: number, topics: string[]) => {
  const subscription = subscriptions.get(subscriptionId)

  if (!subscription) {
    return
  }

  subscription.topics = new Set(topics.filter(Boolean))
  connectEventSource()
}

const unregisterTopics = (subscriptionId: number) => {
  subscriptions.delete(subscriptionId)
  connectEventSource()
}

export const useMercureEventSource = (topics: Ref<string[]>, onMessage: MercureMessageHandler) => {
  const subscriptionId = ++nextSubscriptionId

  subscriptions.set(subscriptionId, {
    topics: new Set(),
    handler: onMessage,
  })

  const deduplicatedTopics = computed(() => [...new Set(topics.value.filter(Boolean))])

  const stopWatchingTopics = watch(
    deduplicatedTopics,
    (nextTopics) => {
      registerTopics(subscriptionId, nextTopics)
    },
    { immediate: true },
  )

  const close = () => {
    stopWatchingTopics()
    unregisterTopics(subscriptionId)
  }

  onBeforeUnmount(close)

  return {
    close,
    reconnect: connectEventSource,
  }
}
