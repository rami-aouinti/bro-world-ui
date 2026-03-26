const isTelemetryDebugEnabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === '1'
    || normalizedValue === 'true'
    || normalizedValue === 'yes'
    || normalizedValue === 'on'
}

export const shouldLogTelemetry = (): boolean => {
  if (import.meta.dev) {
    return true
  }

  const runtimeConfig = useRuntimeConfig()
  const debugTelemetryEnv = typeof process !== 'undefined'
    ? process.env.NUXT_PUBLIC_DEBUG_TELEMETRY
    : undefined

  return isTelemetryDebugEnabled(runtimeConfig.public?.debugTelemetry)
    || isTelemetryDebugEnabled(runtimeConfig.public?.DEBUG_TELEMETRY)
    || isTelemetryDebugEnabled(debugTelemetryEnv)
}
