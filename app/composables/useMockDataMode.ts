export function useMockDataMode(): boolean {
  return useRuntimeConfig().public.useMockData === true
}
