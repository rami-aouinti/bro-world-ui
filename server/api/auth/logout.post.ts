import { clearAuthCookie } from '../../../server/utils/authCookie'

export default defineEventHandler(async (event) => {
  clearAuthCookie(event)

  return {
    success: true,
  }
})
