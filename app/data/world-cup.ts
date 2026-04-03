export type WorldCupCountry = {
  name: string
  code: string
}

export type WorldCupStandingRow = {
  teamCode: string
  points: number
  diff: number
  matches: number
}

export type WorldCupMatch = {
  datetime: string
  teamA: string
  teamB: string
  group: string
}

export const worldCupGroups: Record<string, WorldCupCountry[]> = {
  A: [
    { name: 'United States', code: 'us' },
    { name: 'Mexico', code: 'mx' },
    { name: 'Costa Rica', code: 'cr' },
    { name: 'Qatar', code: 'qa' },
  ],
  B: [
    { name: 'Brazil', code: 'br' },
    { name: 'Nigeria', code: 'ng' },
    { name: 'Japan', code: 'jp' },
    { name: 'Serbia', code: 'rs' },
  ],
  C: [
    { name: 'France', code: 'fr' },
    { name: 'Canada', code: 'ca' },
    { name: 'Morocco', code: 'ma' },
    { name: 'South Korea', code: 'kr' },
  ],
  D: [
    { name: 'Argentina', code: 'ar' },
    { name: 'Sweden', code: 'se' },
    { name: 'Egypt', code: 'eg' },
    { name: 'Australia', code: 'au' },
  ],
  E: [
    { name: 'Spain', code: 'es' },
    { name: 'United Arab Emirates', code: 'ae' },
    { name: 'Colombia', code: 'co' },
    { name: 'Algeria', code: 'dz' },
  ],
  F: [
    { name: 'Germany', code: 'de' },
    { name: 'Tunisia', code: 'tn' },
    { name: 'United States Virgin Islands', code: 'vi' },
    { name: 'Ghana', code: 'gh' },
  ],
  G: [
    { name: 'England', code: 'gb' },
    { name: 'Senegal', code: 'sn' },
    { name: 'Ecuador', code: 'ec' },
    { name: 'Iraq', code: 'iq' },
  ],
  H: [
    { name: 'Netherlands', code: 'nl' },
    { name: 'Cameroon', code: 'cm' },
    { name: 'Peru', code: 'pe' },
    { name: 'Ukraine', code: 'ua' },
  ],
  I: [
    { name: 'Portugal', code: 'pt' },
    { name: 'Saudi Arabia', code: 'sa' },
    { name: 'Chile', code: 'cl' },
    { name: 'Bolivia', code: 'bo' },
  ],
  J: [
    { name: 'Italy', code: 'it' },
    { name: 'Iran', code: 'ir' },
    { name: 'Paraguay', code: 'py' },
    { name: 'Côte d\'Ivoire', code: 'ci' },
  ],
  K: [
    { name: 'Belgium', code: 'be' },
    { name: 'Poland', code: 'pl' },
    { name: 'Uruguay', code: 'uy' },
    { name: 'South Africa', code: 'za' },
  ],
  L: [
    { name: 'Croatia', code: 'hr' },
    { name: 'Denmark', code: 'dk' },
    { name: 'Turkey', code: 'tr' },
    { name: 'New Zealand', code: 'nz' },
  ],
}

export const worldCupStandings: Record<string, WorldCupStandingRow[]> = {
  A: [
    { teamCode: 'us', points: 7, diff: 5, matches: 3 },
    { teamCode: 'mx', points: 5, diff: 2, matches: 3 },
    { teamCode: 'cr', points: 3, diff: -1, matches: 3 },
    { teamCode: 'qa', points: 1, diff: -6, matches: 3 },
  ],
  B: [
    { teamCode: 'br', points: 9, diff: 7, matches: 3 },
    { teamCode: 'jp', points: 4, diff: 0, matches: 3 },
    { teamCode: 'ng', points: 2, diff: -2, matches: 3 },
    { teamCode: 'rs', points: 1, diff: -5, matches: 3 },
  ],
  C: [
    { teamCode: 'fr', points: 6, diff: 4, matches: 3 },
    { teamCode: 'ma', points: 6, diff: 3, matches: 3 },
    { teamCode: 'ca', points: 3, diff: -1, matches: 3 },
    { teamCode: 'kr', points: 1, diff: -6, matches: 3 },
  ],
  D: [
    { teamCode: 'ar', points: 7, diff: 6, matches: 3 },
    { teamCode: 'se', points: 5, diff: 1, matches: 3 },
    { teamCode: 'au', points: 2, diff: -2, matches: 3 },
    { teamCode: 'eg', points: 1, diff: -5, matches: 3 },
  ],
  E: [
    { teamCode: 'es', points: 7, diff: 5, matches: 3 },
    { teamCode: 'co', points: 6, diff: 2, matches: 3 },
    { teamCode: 'ae', points: 3, diff: -1, matches: 3 },
    { teamCode: 'dz', points: 1, diff: -6, matches: 3 },
  ],
  F: [
    { teamCode: 'de', points: 8, diff: 4, matches: 3 },
    { teamCode: 'gh', points: 4, diff: 1, matches: 3 },
    { teamCode: 'tn', points: 3, diff: -1, matches: 3 },
    { teamCode: 'vi', points: 1, diff: -4, matches: 3 },
  ],
  G: [
    { teamCode: 'gb', points: 7, diff: 3, matches: 3 },
    { teamCode: 'sn', points: 6, diff: 2, matches: 3 },
    { teamCode: 'ec', points: 3, diff: -1, matches: 3 },
    { teamCode: 'iq', points: 1, diff: -4, matches: 3 },
  ],
  H: [
    { teamCode: 'nl', points: 9, diff: 6, matches: 3 },
    { teamCode: 'ua', points: 4, diff: 0, matches: 3 },
    { teamCode: 'pe', points: 3, diff: -2, matches: 3 },
    { teamCode: 'cm', points: 1, diff: -4, matches: 3 },
  ],
  I: [
    { teamCode: 'pt', points: 7, diff: 4, matches: 3 },
    { teamCode: 'cl', points: 5, diff: 1, matches: 3 },
    { teamCode: 'sa', points: 3, diff: -1, matches: 3 },
    { teamCode: 'bo', points: 1, diff: -4, matches: 3 },
  ],
  J: [
    { teamCode: 'it', points: 6, diff: 3, matches: 3 },
    { teamCode: 'ir', points: 6, diff: 2, matches: 3 },
    { teamCode: 'ci', points: 3, diff: -1, matches: 3 },
    { teamCode: 'py', points: 1, diff: -4, matches: 3 },
  ],
  K: [
    { teamCode: 'be', points: 8, diff: 5, matches: 3 },
    { teamCode: 'pl', points: 4, diff: 0, matches: 3 },
    { teamCode: 'uy', points: 3, diff: -1, matches: 3 },
    { teamCode: 'za', points: 1, diff: -4, matches: 3 },
  ],
  L: [
    { teamCode: 'hr', points: 7, diff: 3, matches: 3 },
    { teamCode: 'dk', points: 5, diff: 1, matches: 3 },
    { teamCode: 'tr', points: 3, diff: -1, matches: 3 },
    { teamCode: 'nz', points: 1, diff: -3, matches: 3 },
  ],
}

const worldCupUpcomingMatchesUnsorted: WorldCupMatch[] = [
  { datetime: '2026-06-15T13:00:00Z', teamA: 'us', teamB: 'mx', group: 'A' },
  { datetime: '2026-06-15T16:00:00Z', teamA: 'br', teamB: 'jp', group: 'B' },
  { datetime: '2026-06-15T19:00:00Z', teamA: 'fr', teamB: 'ma', group: 'C' },
  { datetime: '2026-06-16T13:00:00Z', teamA: 'ar', teamB: 'se', group: 'D' },
  { datetime: '2026-06-16T16:00:00Z', teamA: 'es', teamB: 'co', group: 'E' },
  { datetime: '2026-06-16T19:00:00Z', teamA: 'de', teamB: 'gh', group: 'F' },
  { datetime: '2026-06-17T13:00:00Z', teamA: 'gb', teamB: 'sn', group: 'G' },
  { datetime: '2026-06-17T16:00:00Z', teamA: 'nl', teamB: 'ua', group: 'H' },
  { datetime: '2026-06-17T19:00:00Z', teamA: 'pt', teamB: 'cl', group: 'I' },
  { datetime: '2026-06-18T13:00:00Z', teamA: 'it', teamB: 'ir', group: 'J' },
  { datetime: '2026-06-18T16:00:00Z', teamA: 'be', teamB: 'pl', group: 'K' },
  { datetime: '2026-06-18T19:00:00Z', teamA: 'hr', teamB: 'dk', group: 'L' },
]

export const worldCupUpcomingMatches = worldCupUpcomingMatchesUnsorted
  .slice()
  .sort((a, b) => a.datetime.localeCompare(b.datetime))
