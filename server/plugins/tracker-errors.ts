const stableHash = (value: string): string => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, context) => {
    const event = context?.event
    const routePath = event?.path || 'unknown'
    const userAgent = event?.node?.req?.headers['user-agent']
    const userIdHash = userAgent ? `ua_${stableHash(String(userAgent))}` : null

    console.error('[tracker] error.server.global', {
      routePath,
      userIdHash,
      message: error?.message,
      stack: error?.stack,
    })
  })
})
