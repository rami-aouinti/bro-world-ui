const ISO3_TO_ISO2_MAP: Record<string, string> = {
  // Group A
  USA: 'us',
  MEX: 'mx',
  CRI: 'cr',
  CRC: 'cr',
  QAT: 'qa',

  // Group B
  BRA: 'br',
  NGA: 'ng',
  JPN: 'jp',
  SRB: 'rs',

  // Group C
  FRA: 'fr',
  CAN: 'ca',
  MAR: 'ma',
  KOR: 'kr',

  // Group D
  ARG: 'ar',
  SWE: 'se',
  EGY: 'eg',
  AUS: 'au',

  // Group E
  ESP: 'es',
  ARE: 'ae',
  UAE: 'ae',
  COL: 'co',
  DZA: 'dz',
  ALG: 'dz',

  // Group F
  DEU: 'de',
  GER: 'de',
  TUN: 'tn',
  VIR: 'vi',
  GHA: 'gh',

  // Group G
  GBR: 'gb',
  ENG: 'gb',
  SEN: 'sn',
  ECU: 'ec',
  IRQ: 'iq',

  // Group H
  NLD: 'nl',
  NED: 'nl',
  CMR: 'cm',
  PER: 'pe',
  UKR: 'ua',

  // Group I
  PRT: 'pt',
  SAU: 'sa',
  KSA: 'sa',
  CHL: 'cl',
  BOL: 'bo',

  // Group J
  ITA: 'it',
  IRN: 'ir',
  PRY: 'py',
  CIV: 'ci',

  // Group K
  BEL: 'be',
  POL: 'pl',
  URY: 'uy',
  ZAF: 'za',

  // Group L
  HRV: 'hr',
  DNK: 'dk',
  TUR: 'tr',
  NZL: 'nz',
}

export const iso3ToIso2 = (code3: string): string | null => {
  if (typeof code3 !== 'string') {
    return null
  }

  const normalized = code3.trim().toUpperCase()

  if (!normalized) {
    return null
  }

  if (normalized.length === 2) {
    return normalized.toLowerCase()
  }

  return ISO3_TO_ISO2_MAP[normalized] ?? null
}
