import { applySessionCookie, refreshSession, requireSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { sessionId, session } = await requireSession(event)
  const nextSession = await refreshSession(sessionId, session)

  const path = getRouterParam(event, 'path') || ''
  const targetPath = `/${path}`
  const method = getMethod(event)
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(event)

  const response = await $fetch(targetPath, {
    method,
    baseURL: config.public.apiBase,
    query: getQuery(event),
    body,
    headers: {
      accept: getHeader(event, 'accept') || 'application/json',
      'content-type': getHeader(event, 'content-type') || 'application/json',
      Authorization: `Bearer ${nextSession.token}`,
    },
  })

  applySessionCookie(event, sessionId)

  return response
})
