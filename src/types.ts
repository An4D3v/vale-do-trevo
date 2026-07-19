export type Facing = 'up' | 'down' | 'left' | 'right'

export type QuestStage = 'pre' | 'active' | 'done'

// capítulo 2: trancado -> passagem aberta -> luta com o borrão-mor -> amizade feita
export type Chapter2 = 'locked' | 'open' | 'boss' | 'done'

export type NpcId = 'canela' | 'lesma' | 'gota'

export type Speaker = 'nino' | 'canela' | 'lesma' | 'gota' | 'borrao'

export type BossState = 'idle' | 'chase' | 'stun' | 'defeated' | 'friend'

export interface Boss {
  x: number
  y: number
  homeX: number
  homeY: number
  hp: number
  state: BossState
  stunT: number
  hitCd: number // janela pós-acerto em que ele não toma outro hit (evita stun-lock)
  spawnT: number
  seed: number
}

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
  minion?: boolean // lacaio do borrão-mor: sempre persegue e não renasce
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
  who: Speaker
  text: string
}

export type DecorKind = 'tree' | 'house' | 'rock' | 'flower' | 'mushroom'

export interface Decor {
  kind: DecorKind
  x: number // px, centro da base
  y: number // px, linha do chão (p/ ordenação)
  seed: number
}

export type Floor = 'grass' | 'path' | 'water' | 'dark' | 'cave'

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
  gate: { x: number; y: number }[] // pedras que fecham a passagem da caverna (cap. 2)
  bossHome: { x: number; y: number }
}
