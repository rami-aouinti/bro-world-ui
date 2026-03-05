import { clearAuthCookie } from '../../../server/utils/authCookie'

export default defineEventHandler(async (event) => {
  await clearAuthCookie(event)

  return {
    success: true,
  }
})
