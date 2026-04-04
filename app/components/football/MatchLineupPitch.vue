<script setup lang="ts">
import FootballAvatar from './FootballAvatar.vue'
import type { LineupEntry, MatchLineup, MatchPlayersByTeam } from './types'

type TeamSide = 'home' | 'away'

type StarterDot = {
  key: string
  side: TeamSide
  top: number
  left: number
  name: string
  shortName: string
  number: number | null
  pos: string | null
  photo: string | null
}

const props = defineProps<{
  lineups: MatchLineup[]
  players?: MatchPlayersByTeam[]
}>()

const placeholder = '—'

const playerPhotoById = computed(() => {
  const byId = new Map<number, string>()
  const byName = new Map<string, string>()

  for (const teamBlock of props.players || []) {
    for (const row of teamBlock?.players || []) {
      const id = Number(row?.player?.id)
      const name = String(row?.player?.name || '').trim().toLowerCase()
      const photo = row?.player?.photo

      if (Number.isFinite(id) && photo) {
        byId.set(id, photo)
      }
      if (name && photo) {
        byName.set(name, photo)
      }
    }
  }

  return { byId, byName }
})

const shortName = (name?: string | null) => {
  const value = String(name || '').trim()
  if (!value) {
    return placeholder
  }

  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length <= 1) {
    return value
  }

  const last = parts[parts.length - 1]
  return `${parts[0][0]}. ${last}`
}

const parseFormation = (formation?: string | null) => {
  const chunks = String(formation || '')
    .split('-')
    .map(chunk => Number(chunk.trim()))
    .filter(value => Number.isFinite(value) && value > 0)

  return chunks
}

const parseGrid = (grid?: string | null) => {
  const [rowRaw, colRaw] = String(grid || '').split(':')
  const row = Number(rowRaw)
  const col = Number(colRaw)
  if (!Number.isFinite(row) || !Number.isFinite(col) || row <= 0 || col <= 0) {
    return null
  }

  return { row, col }
}

const rowsFromStarters = (lineup: MatchLineup) => {
  const starters = (lineup?.startXI || []).map((entry, index) => {
    const id = Number(entry?.player?.id)
    const name = String(entry?.player?.name || '').trim()
    const key = Number.isFinite(id)
      ? `id-${id}`
      : `${name.toLowerCase()}-${index}`

    const fromById = Number.isFinite(id) ? playerPhotoById.value.byId.get(id) : null
    const fromByName = name ? playerPhotoById.value.byName.get(name.toLowerCase()) : null

    return {
      key,
      number: entry?.player?.number != null ? Number(entry.player.number) : null,
      pos: entry?.player?.pos ? String(entry.player.pos) : null,
      name: name || placeholder,
      photo: fromById || fromByName || null,
      grid: parseGrid(entry?.player?.grid),
    }
  })

  const formationLines = parseFormation(lineup?.formation)
  const rowCaps: number[] = [1, ...formationLines]
  const rows = new Map<number, typeof starters>()
  const assigned = new Set<string>()

  const pushToRow = (rowIndex: number, player: (typeof starters)[number]) => {
    rows.set(rowIndex, [...(rows.get(rowIndex) || []), player])
    assigned.add(player.key)
  }

  for (const player of starters) {
    if (!player.grid) {
      continue
    }

    pushToRow(player.grid.row, player)
  }

  const unresolved = starters.filter(player => !assigned.has(player.key))
  const sortedUnresolved = unresolved.sort((a, b) => {
    const aIsGoalie = a.pos === 'G' ? 0 : 1
    const bIsGoalie = b.pos === 'G' ? 0 : 1

    if (aIsGoalie !== bIsGoalie) {
      return aIsGoalie - bIsGoalie
    }

    return (a.number || 99) - (b.number || 99)
  })

  const targetRows = Math.max(rowCaps.length, ...Array.from(rows.keys()), 1)

  for (const player of sortedUnresolved) {
    if (player.pos === 'G') {
      pushToRow(1, player)
      continue
    }

    let bestRow = 2
    let bestScore = Number.POSITIVE_INFINITY

    for (let row = 2; row <= targetRows; row += 1) {
      const current = (rows.get(row) || []).length
      const cap = rowCaps[row - 1] || rowCaps[rowCaps.length - 1] || 1
      const score = current / cap
      if (score < bestScore) {
        bestScore = score
        bestRow = row
      }
    }

    pushToRow(bestRow, player)
  }

  const finalRows = Array.from(rows.entries())
    .sort(([a], [b]) => a - b)
    .map(([row, players]) => {
      const sorted = [...players].sort((a, b) => {
        const aCol = a.grid?.col ?? Number.POSITIVE_INFINITY
        const bCol = b.grid?.col ?? Number.POSITIVE_INFINITY
        if (aCol !== bCol) {
          return aCol - bCol
        }
        return (a.number || 99) - (b.number || 99)
      })
      return { row, players: sorted }
    })

  return finalRows
}

const markerTop = (side: TeamSide, rowIndex: number, rowCount: number) => {
  const normalized = rowCount === 1 ? 0.5 : rowIndex / (rowCount - 1)
  const local = 12 + normalized * 76

  if (side === 'home') {
    return local * 0.5
  }

  return 50 + (100 - local) * 0.5
}

const startersOnPitch = computed<StarterDot[]>(() => {
  const result: StarterDot[] = []
  const visibleLineups = props.lineups.slice(0, 2)

  visibleLineups.forEach((lineup, lineupIndex) => {
    const side: TeamSide = lineupIndex === 0 ? 'home' : 'away'
    const rows = rowsFromStarters(lineup)

    rows.forEach((rowBlock, rowIndex) => {
      const rowPlayers = rowBlock.players
      rowPlayers.forEach((player, index) => {
        const left = ((index + 1) / (rowPlayers.length + 1)) * 100
        result.push({
          key: `${side}-${player.key}-${rowBlock.row}-${index}`,
          side,
          top: markerTop(side, rowIndex, rows.length),
          left,
          name: player.name,
          shortName: shortName(player.name),
          number: player.number,
          pos: player.pos,
          photo: player.photo,
        })
      })
    })
  })

  return result
})

const playerLabel = (entry: LineupEntry) => {
  const player = entry?.player
  const name = player?.name || placeholder
  const number = player?.number == null ? '' : `#${player.number}`
  const pos = player?.pos || ''
  return [number, name, pos].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="pa-3">
    <v-alert v-if="!props.lineups.length" type="info" variant="tonal" density="comfortable">
      Aucune composition disponible.
    </v-alert>

    <div v-else class="lineup-board-wrap">
      <div class="pitch-scroll">
        <div class="lineup-pitch">
          <div class="pitch-half pitch-home">
            <div class="pitch-title">Home</div>
          </div>
          <div class="pitch-half pitch-away">
            <div class="pitch-title">Away</div>
          </div>

          <div
            v-for="dot in startersOnPitch"
            :key="dot.key"
            class="player-dot"
            :class="`player-dot--${dot.side}`"
            :style="{ top: `${dot.top}%`, left: `${dot.left}%` }"
          >
            <FootballAvatar
              v-if="dot.photo"
              :src="dot.photo"
              :alt="`Photo ${dot.name}`"
              :size="36"
              icon="mdi-account"
            />
            <div v-else class="player-fallback">{{ dot.number ?? '?' }}</div>
            <div class="player-name">{{ dot.shortName }}</div>
          </div>
        </div>
      </div>

      <div class="lineups-grid mt-3">
        <v-card v-for="(lineup, index) in props.lineups" :key="`${lineup?.team?.id || index}`" variant="tonal" class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2 min-w-0">
              <FootballAvatar :src="lineup?.team?.logo" :alt="`Logo ${lineup?.team?.name || 'Équipe'}`" :size="24" icon="mdi-shield-outline" />
              <div class="text-body-2 font-weight-bold text-truncate">{{ lineup?.team?.name || placeholder }}</div>
            </div>
            <v-chip size="x-small" label>{{ lineup?.formation || placeholder }}</v-chip>
          </div>

          <div class="d-flex align-center ga-2 mb-2 coach-row">
            <FootballAvatar :src="lineup?.coach?.photo" :alt="`Coach ${lineup?.coach?.name || placeholder}`" :size="28" icon="mdi-account-tie" />
            <div class="text-caption text-medium-emphasis">
              Coach: <strong>{{ lineup?.coach?.name || placeholder }}</strong>
            </div>
          </div>

          <div class="text-caption text-medium-emphasis mb-1">Remplaçants</div>
          <v-list density="compact" class="bg-transparent py-0">
            <v-list-item
              v-for="(entry, subIndex) in lineup?.substitutes || []"
              :key="`sub-${lineup?.team?.id || index}-${subIndex}`"
              :title="playerLabel(entry)"
              class="px-1"
            />
            <v-list-item v-if="!(lineup?.substitutes || []).length" title="—" class="px-1" />
          </v-list>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lineup-board-wrap {
  display: grid;
  gap: 12px;
}

.pitch-scroll {
  overflow-x: auto;
}

.lineup-pitch {
  position: relative;
  min-height: 620px;
  min-width: 680px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, #2b8f44 0%, #277f3d 100%);
}

.lineup-pitch::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 9%,
    rgba(255, 255, 255, 0.12) 10%,
    transparent 11%,
    transparent 19%,
    rgba(255, 255, 255, 0.12) 20%,
    transparent 21%
  );
  background-size: 100% 64px;
  pointer-events: none;
}

.lineup-pitch::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 2px solid rgba(255, 255, 255, 0.9);
}

.pitch-half {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
}

.pitch-home {
  top: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
}

.pitch-away {
  top: 50%;
}

.pitch-title {
  position: absolute;
  left: 8px;
  top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.04em;
  font-weight: 700;
  text-transform: uppercase;
}

.player-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  justify-items: center;
  gap: 4px;
  width: 80px;
  z-index: 2;
}

.player-fallback {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.player-dot--home .player-fallback {
  background: #0d47a1;
}

.player-dot--away .player-fallback {
  background: #b71c1c;
}

.player-name {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
}

.lineups-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.coach-row {
  min-height: 32px;
}

@media (max-width: 760px) {
  .lineup-pitch {
    min-height: 540px;
    min-width: 620px;
  }

  .player-dot {
    width: 70px;
  }

  .player-name {
    max-width: 70px;
  }
}
</style>
