import { checkRedisCacheHealth } from '~~/server/utils/redis'

export default defineNitroPlugin(() => {
  void checkRedisCacheHealth()
})
