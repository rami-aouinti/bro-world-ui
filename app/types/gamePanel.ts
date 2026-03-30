export interface GamePanelAction {
  id: string
  label: string
  disabled?: boolean
}

export interface GamePanelChipStat {
  id: string
  label: string
  value: string | number
  color?: string
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'plain' | 'elevated'
  icon?: string
}

export interface GamePanelStatePayload {
  title: string
  summaryLines: string[]
  statusMessage: string
  statsChips: GamePanelChipStat[]
  actions: GamePanelAction[]
}
