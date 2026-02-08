export interface BotStatus {
  connected: boolean
  gid: number
  name: string
  level: number
  gold: number
  exp: number
  expProgress: { current: number; needed: number }
  features: Record<string, boolean>
  currentPlant: { name: string; seedId: number } | null
  landSummary: { total: number; growing: number; harvestable: number; empty: number }
}

export interface AppConfig {
  platform: 'qq' | 'wx'
  farmInterval: number
  friendInterval: number
  plantMode: 'auto' | 'manual'
  plantSeedId: number
  features: Record<string, boolean>
}

export interface PlantOption {
  seedId: number
  name: string
  growTime: number
  growTimeWithFert: number
  expPerHarvest: number
  expPerHour: number
  rank: number
}

export interface PlantPlanResult {
  currentLevel: number
  recommended: PlantOption
  options: PlantOption[]
}

export interface LogEntry {
  time: string
  category: 'farm' | 'friend' | 'task' | 'system' | 'shop'
  level: 'info' | 'warn'
  message: string
}

export interface FriendInfo {
  gid: number
  name: string
  level: number
  lastAction: string
}

export const DEFAULT_FEATURES: Record<string, boolean> = {
  autoHarvest: true,
  autoPlant: true,
  autoFertilize: true,
  autoWeed: true,
  autoBug: true,
  autoWater: true,
  friendPatrol: true,
  autoSteal: true,
  friendHelp: true,
  autoTask: true,
}
