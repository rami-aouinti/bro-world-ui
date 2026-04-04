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

export interface SportTeamItem {
  id: string
  name: string
  logo: string
  code: string
  country: string
  founded: number | null
  national: boolean
  venue: {
    name: string
    city: string
    address: string
    capacity: number | null
    surface: string
    image: string
  }
}
