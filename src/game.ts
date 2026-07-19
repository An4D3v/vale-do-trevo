// estado e regras do jogo — sem canvas aqui; o render lê estes campos.

import {
  TILE,
  WALK_SPEED,
  ATTACK_TIME,
  ATTACK_COOLDOWN,
  IFRAMES,
  MAX_HEARTS,
  BLOB_WANDER_SPEED,
  BLOB_CHASE_SPEED,
  BLOB_SIGHT,
  BLOB_RESPAWN,
  TOTAL_TREVOS,
  AMIZADE_MAX,
  AMIZADE_CORES,
} from './constants'
import { buildWorld, canStand, insideRocky } from './world'
import { dialogueFor } from './dialogue'
import type { Facing, QuestStage, Npc, Blob, Trevo, Particle, Toast, DialogueLine, NpcId, WorldData } from './types'
import { moveVector, type InputState } from './input'

export interface DialogueBox {
  open: boolean
  npc: NpcId | null
  lines: DialogueLine[]
  idx: number
  chars: number // caracteres já revelados (máquina de escrever)
}

export class Game {
  world: WorldData = buildWorld()
  player = {
    x: 0,
    y: 0,
    facing: 'down' as Facing,
    walking: false,
    hearts: MAX_HEARTS,
    iframes: 0,
    attackT: 0, // >0 = bastão em movimento
    attackCd: 0,
  }
  npcs: Npc[] = []
  blobs: Blob[] = []
  trevos: Trevo[] = []
  particles: Particle[] = []
  toasts: Toast[] = []
  dialogue: DialogueBox = { open: false, npc: null, lines: [], idx: 0, chars: 0 }

  questStage: QuestStage = 'pre'
  trevoCount = 0
  blobTrevoDrops = 0 // trevos que já caíram de borrão (2 no total)
  amizade = 0 // nível de amizade com a canela (0..5) — muda a cor da bandana dela
  blobsMortos = 0
  celebrated = false
  faintT = 0
  nearNpc: NpcId | null = null
  camX = 0
  camY = 0
  t = 0

  constructor() {
    this.player.x = this.world.playerStart.x
    this.player.y = this.world.playerStart.y
    this.npcs = this.world.npcs.map((n) => ({ ...n }))
    this.blobs = this.world.blobs.map((b, i) => ({
      x: b.x,
      y: b.y,
      homeX: b.x,
      homeY: b.y,
      targetX: b.x,
      targetY: b.y,
      retargetT: 0,
      state: 'wander' as const,
      respawnT: 0,
      seed: 100 + i * 7,
    }))
    this.trevos = this.world.trevos.map((t, i) => ({ x: t.x, y: t.y, taken: false, seed: 200 + i * 3 }))
    this.camX = this.player.x
    this.camY = this.player.y
  }

  update(dt: number, input: InputState) {
    this.t += dt
    // avisa o input quando uma "tela" está aberta (toque vira só avançar/confirmar)
    input.uiModal = this.dialogue.open || this.faintT > 0

    // partículas e toasts andam sempre (até com diálogo aberto, fica vivo)
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 60 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const tst of this.toasts) {
      tst.y -= 22 * dt
      tst.life -= dt
    }
    this.toasts = this.toasts.filter((t) => t.life > 0)

    if (this.faintT > 0) {
      this.faintT -= dt
      input.actionPressed = false
      input.attackPressed = false
      if (this.faintT <= 0) {
        this.player.x = this.world.playerStart.x
        this.player.y = this.world.playerStart.y
        this.player.hearts = MAX_HEARTS
        this.player.iframes = 2
        // câmera acorda junto na vila (sem pan varrendo o mapa)
        this.camX = this.player.x
        this.camY = this.player.y
      }
      return
    }

    if (this.dialogue.open) {
      this.updateDialogue(dt, input)
      input.attackPressed = false
      return
    }

    this.updatePlayer(dt, input)
    this.updateBlobs(dt)
    this.updatePickups()
    this.updateNearNpc(input)
    this.updateCamera(dt)

    input.actionPressed = false
    input.attackPressed = false
    // re-sincroniza: se um diálogo abriu NESTE frame, o toque seguinte já cai no modo modal
    input.uiModal = this.dialogue.open || this.faintT > 0
  }

  // ---- diálogo ----

  private updateDialogue(dt: number, input: InputState) {
    const line = this.dialogue.lines[this.dialogue.idx]
    if (this.dialogue.chars < line.text.length)
      this.dialogue.chars = Math.min(line.text.length, this.dialogue.chars + 96 * dt)
    if (input.actionPressed) {
      input.actionPressed = false
      if (this.dialogue.chars < line.text.length) {
        this.dialogue.chars = line.text.length // completa a linha
      } else if (this.dialogue.idx < this.dialogue.lines.length - 1) {
        this.dialogue.idx++
        this.dialogue.chars = 0
      } else {
        this.closeDialogue()
      }
    }
  }

  private closeDialogue() {
    const npc = this.dialogue.npc
    this.dialogue.open = false
    this.dialogue.npc = null
    if (npc === 'canela') {
      if (this.questStage === 'pre') {
        this.questStage = 'active'
        this.gainAmizade(1) // aceitou ajudar: a canela já gosta de você
      } else if (this.questStage === 'active' && this.trevoCount >= TOTAL_TREVOS) {
        this.questStage = 'done'
        this.celebrate()
        this.gainAmizade(2) // salvou o vale!
      }
    }
  }

  private startDialogue(npc: NpcId) {
    this.dialogue = {
      open: true,
      npc,
      lines: dialogueFor(npc, this.questStage, this.trevoCount, this.amizade),
      idx: 0,
      chars: 0,
    }
  }

  /** amizade com a canela: a bandana dela evolui pelo arco-íris */
  private gainAmizade(n: number) {
    const antes = this.amizade
    this.amizade = Math.min(AMIZADE_MAX, this.amizade + n)
    if (this.amizade === antes) return
    const p = this.player
    this.toast(p.x, p.y - 56, `amizade com a canela: nível ${this.amizade}!`)
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2
      this.particles.push({
        x: p.x,
        y: p.y - 24,
        vx: Math.cos(a) * 40,
        vy: Math.sin(a) * 40 - 55,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: 2.5 + Math.random() * 2,
        color: AMIZADE_CORES[this.amizade],
      })
    }
  }

  private celebrate() {
    this.celebrated = true
    const cn = this.npcs.find((n) => n.id === 'canela')!
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 40 + Math.random() * 130
      this.particles.push({
        x: cn.x,
        y: cn.y - 30,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 70,
        life: 1 + Math.random(),
        maxLife: 2,
        size: 3 + Math.random() * 3,
        color: ['#e8702a', '#4caf50', '#f4c95d', '#8e44ad', '#39c0ed', '#f28ba8'][i % 6],
      })
    }
  }

  // ---- jogador ----

  private updatePlayer(dt: number, input: InputState) {
    const p = this.player
    if (p.iframes > 0) p.iframes -= dt
    if (p.attackCd > 0) p.attackCd -= dt
    if (p.attackT > 0) p.attackT -= dt

    const [mx, my] = moveVector(input)
    p.walking = Math.hypot(mx, my) > 0.05
    if (p.walking) {
      if (Math.abs(mx) >= Math.abs(my)) p.facing = mx < 0 ? 'left' : 'right'
      else p.facing = my < 0 ? 'up' : 'down'
      const nx = p.x + mx * WALK_SPEED * dt
      const ny = p.y + my * WALK_SPEED * dt
      if (canStand(this.world, nx, p.y)) p.x = nx
      if (canStand(this.world, p.x, ny)) p.y = ny
    }

    if (input.attackPressed && p.attackCd <= 0) {
      p.attackT = ATTACK_TIME
      p.attackCd = ATTACK_COOLDOWN
      this.swingHits()
    }
  }

  /** ponto central do golpe, na direção que o nino olha */
  attackPoint(): [number, number] {
    const p = this.player
    const d = TILE * 0.9
    if (p.facing === 'up') return [p.x, p.y - d]
    if (p.facing === 'down') return [p.x, p.y + d * 0.7]
    if (p.facing === 'left') return [p.x - d, p.y - 6]
    return [p.x + d, p.y - 6]
  }

  private swingHits() {
    const [ax, ay] = this.attackPoint()
    for (const b of this.blobs) {
      if (b.state === 'dead') continue
      if (Math.hypot(b.x - ax, b.y - 14 - ay) < TILE * 0.95) this.killBlob(b)
    }
  }

  private killBlob(b: Blob) {
    b.state = 'dead'
    b.respawnT = BLOB_RESPAWN
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 30 + Math.random() * 80
      this.particles.push({
        x: b.x,
        y: b.y - 12,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 2.5 + Math.random() * 3,
        color: '#57506b',
      })
    }
    // limpar o vale aproxima vocês: a cada 2 borrões, a amizade cresce
    // (só depois de conhecer a canela — antes da missão não existe laço ainda)
    if (this.questStage !== 'pre') {
      this.blobsMortos++
      if (this.blobsMortos % 2 === 0) this.gainAmizade(1)
    }
    // os 2 primeiros borrões derrotados soltam trevo
    if (this.blobTrevoDrops < 2) {
      this.blobTrevoDrops++
      this.trevos.push({ x: b.x, y: b.y, taken: false, seed: 300 + this.blobTrevoDrops })
      this.toast(b.x, b.y - 30, 'o borrão soltou um trevo!')
    } else {
      this.toast(b.x, b.y - 30, 'plof!')
    }
  }

  // ---- borrões ----

  private updateBlobs(dt: number) {
    const p = this.player
    for (const b of this.blobs) {
      if (b.state === 'dead') {
        b.respawnT -= dt
        // só renasce com o jogador longe do ponto (senão apareceria em cima dele)
        if (b.respawnT <= 0 && Math.hypot(p.x - b.homeX, p.y - b.homeY) > BLOB_SIGHT) {
          b.state = 'wander'
          b.x = b.homeX
          b.y = b.homeY
        }
        continue
      }

      const distP = Math.hypot(p.x - b.x, p.y - b.y)
      const playerInRocky = insideRocky(Math.floor(p.x / TILE), Math.floor(p.y / TILE))
      b.state = distP < BLOB_SIGHT && playerInRocky ? 'chase' : 'wander'

      let tx = b.targetX
      let ty = b.targetY
      let speed = BLOB_WANDER_SPEED
      if (b.state === 'chase') {
        tx = p.x
        ty = p.y
        speed = BLOB_CHASE_SPEED
      } else {
        b.retargetT -= dt
        if (b.retargetT <= 0 || Math.hypot(tx - b.x, ty - b.y) < 6) {
          b.retargetT = 2 + Math.random() * 2.5
          const a = Math.random() * Math.PI * 2
          b.targetX = b.homeX + Math.cos(a) * TILE * 3
          b.targetY = b.homeY + Math.sin(a) * TILE * 3
          tx = b.targetX
          ty = b.targetY
        }
      }

      const d = Math.hypot(tx - b.x, ty - b.y)
      if (d > 2) {
        const nx = b.x + ((tx - b.x) / d) * speed * dt
        const ny = b.y + ((ty - b.y) / d) * speed * dt
        if (canStand(this.world, nx, b.y)) b.x = nx
        if (canStand(this.world, b.x, ny)) b.y = ny
      }

      // encostou no nino
      if (distP < TILE * 0.62 && p.iframes <= 0) {
        p.hearts--
        p.iframes = IFRAMES
        const kb = 26
        const d2 = Math.max(1, distP)
        const kx = p.x + ((p.x - b.x) / d2) * kb
        const ky = p.y + ((p.y - b.y) / d2) * kb
        if (canStand(this.world, kx, p.y)) p.x = kx
        if (canStand(this.world, p.x, ky)) p.y = ky
        if (p.hearts <= 0) this.faintT = 2.2
      }
    }
  }

  // ---- trevos ----

  private updatePickups() {
    const p = this.player
    for (const t of this.trevos) {
      if (t.taken) continue
      if (Math.hypot(t.x - p.x, t.y - p.y) < TILE * 0.6) {
        t.taken = true
        this.trevoCount++
        this.toast(t.x, t.y - 26, `+1 trevo (${this.trevoCount}/${TOTAL_TREVOS})`)
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2
          this.particles.push({
            x: t.x,
            y: t.y - 8,
            vx: Math.cos(a) * 50,
            vy: Math.sin(a) * 50 - 40,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            size: 2 + Math.random() * 2,
            color: '#f4c95d',
          })
        }
      }
    }
  }

  // ---- npcs ----

  private updateNearNpc(input: InputState) {
    this.nearNpc = null
    let best = TILE * 1.6
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - this.player.x, n.y - this.player.y)
      if (d < best) {
        best = d
        this.nearNpc = n.id
      }
    }
    if (this.nearNpc && input.actionPressed) {
      input.actionPressed = false
      this.startDialogue(this.nearNpc)
    }
  }

  private updateCamera(dt: number) {
    const k = Math.min(1, dt * 5)
    this.camX += (this.player.x - this.camX) * k
    this.camY += (this.player.y - this.camY) * k
  }

  private toast(x: number, y: number, text: string) {
    this.toasts.push({ x, y, text, life: 1.6 })
  }
}
