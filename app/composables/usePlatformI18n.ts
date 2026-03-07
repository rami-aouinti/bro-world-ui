export const usePlatformI18n = () => {
  const { locale, t } = useI18n()

  const formatCurrency = (value: number, currency = 'EUR') => new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)

  const formatCompactCurrency = (value: number, currency = 'EUR') => new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

  const formatRelativeShort = (raw: string) => {
    const match = raw.match(/^(\d+)([a-zA-Z]+)$/)
    if (!match) return raw

    const amount = Number(match[1])
    const unit = match[2].toLowerCase()

    if (unit === 'j' || unit === 'd') {
      return t('platform.common.time.daysAgo', { count: amount })
    }

    if (unit === 'w') {
      return t('platform.common.time.weeksAgo', { count: amount })
    }

    return raw
  }

  return {
    formatCurrency,
    formatCompactCurrency,
    formatRelativeShort,
  }
}
