export type Nullable<T> = T | null | undefined

export type FootballTeamRef = {
  id?: Nullable<number>
  name?: Nullable<string>
  logo?: Nullable<string>
}

export type MatchEvent = {
  time?: {
    elapsed?: Nullable<number>
    extra?: Nullable<number>
  }
  team?: FootballTeamRef
  player?: {
    id?: Nullable<number>
    name?: Nullable<string>
  }
  assist?: {
    id?: Nullable<number>
    name?: Nullable<string>
  }
  type?: Nullable<string>
  detail?: Nullable<string>
  comments?: Nullable<string>
}

export type LineupEntry = {
  player?: {
    id?: Nullable<number>
    name?: Nullable<string>
    number?: Nullable<number>
    pos?: Nullable<string>
    grid?: Nullable<string>
  }
}

export type MatchLineup = {
  team?: FootballTeamRef
  coach?: {
    id?: Nullable<number>
    name?: Nullable<string>
    photo?: Nullable<string>
  }
  formation?: Nullable<string>
  startXI?: Nullable<LineupEntry[]>
  substitutes?: Nullable<LineupEntry[]>
}

export type MatchStatisticItem = {
  type?: Nullable<string>
  value?: Nullable<string | number>
}

export type MatchStatisticTeam = {
  team?: FootballTeamRef
  statistics?: Nullable<MatchStatisticItem[]>
}

export type MatchPlayerStats = {
  games?: {
    minutes?: Nullable<number>
    rating?: Nullable<string | number>
    position?: Nullable<string>
  }
  goals?: {
    total?: Nullable<number>
    assists?: Nullable<number>
  }
  shots?: {
    total?: Nullable<number>
  }
  duels?: {
    total?: Nullable<number>
  }
}

export type MatchPlayerRow = {
  player?: {
    id?: Nullable<number>
    name?: Nullable<string>
    number?: Nullable<number>
    photo?: Nullable<string>
  }
  statistics?: Nullable<MatchPlayerStats[]>
}

export type MatchPlayersByTeam = {
  team?: FootballTeamRef
  players?: Nullable<MatchPlayerRow[]>
}
