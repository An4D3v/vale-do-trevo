export type Facing = 'up' | 'down' | 'left' | 'right'

export type QuestStage = 'pre' | 'active' | 'done'

export type NpcId = 'canela' | 'lesma'

export interface Npc {
  id: NpcId
  x: number
  y: number
  seed: number
}

export type BlobState = 'wander' | 'chase' | 'dead'

export interface Blob {
  x: number
  y: number
  homeX: number
  homeY: number
  targetX: number
  targetY: number
  retargetT: number
  state: BlobState
  respawnT: number
  seed: number
}

export interface Trevo {
  x: number
  y: number
  taken: boolean
  seed: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export interface Toast {
  x: number
  y: number
  text: string
  life: number
}

export interface DialogueLine {
  who: 'nino' | 'canela' | 'lesma'
  text: string
}

export type DecorKind = 'tree' | 'house' | 'rock' | 'flower' | 'mushroom'

export interface Decor {
  kind: DecorKind
  x: number // px, centro da base
  y: number // px, linha do chão (p/ ordenação)
  seed: number
}

export type Floor = 'grass' | 'path' | 'water' | 'dark'

export interface WorldData {
  w: number // em tiles
  h: number
  floor: Floor[][]
  solid: boolean[][]
  decors: Decor[]
  playerStart: { x: number; y: number }
  npcs: Npc[]
  blobs: { x: number; y: number }[]
  trevos: { x: number; y: number }[]
}
