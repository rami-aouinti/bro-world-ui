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

export interface SportPlayerItem {
  id: string
  name: string
  photo: string
  age: number | null
  height: string
  weight: string
  team: string
  teamLogo: string
  position: string
  league: string
  appearances: number | null
  goals: number | null
  assists: number | null
}
