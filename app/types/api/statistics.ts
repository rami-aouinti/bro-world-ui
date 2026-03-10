export interface StatisticsTotalsByPeriod {
  total: number
  thisWeek?: number
  thisMonth?: number
  thisYear?: number
  last7Days?: number
}

export interface StatisticsNamedCount {
  name: string
  applicationCount?: number
  usageCount?: number
}

export interface AdminStatisticsResponse {
  users: StatisticsTotalsByPeriod
  applications: {
    total: number
    byPlatform: StatisticsNamedCount[]
  }
  plugins: {
    total: number
    usage: StatisticsNamedCount[]
  }
  posts: StatisticsTotalsByPeriod
}
