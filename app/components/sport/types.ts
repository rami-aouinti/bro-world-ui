export interface SportGameCardItem {
  id: string
  status: string
  home: string
  away: string
  scores: {
    home: number | null
    away: number | null
  }
  league: string
  venue: string
  time: string
}
