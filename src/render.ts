// desenho de cada frame: mundo-papel, entidades (ordenadas por y), HUD e diálogo.

import { TILE, VIEW_W, VIEW_H, PAL, MAX_HEARTS, TOTAL_TREVOS, ATTACK_TIME, AMIZADE_MAX, AMIZADE_CORES } from './constants'
import { rng, setSketchPhase, sketchEllipse, sketchPoly, sketchRect, sketchLine, sketchHeart } from './sketch'
import { drawNino, drawCanela, drawLesma, drawBlob, drawClover, drawPortrait } from './characters'
import { NPC_NAMES } from './dialogue'
import { DPAD, BTN_A, BTN_B, type InputState } from './input'
import type { Game } from './game'
import type { Decor } from './types'

const FONT = '"Segoe Print", "Comic Sans MS", "Chalkboard SE", cursive'

// papel de fundo (grão + margens), gerado uma única vez
let paper: HTMLCanvasElement | null = null
function getPaper(): HTMLCanvasElement {
  if (paper) return paper
  paper = document.createElement('canvas')
  paper.width = VIEW_W
  paper.height = VIEW_H
  const c = paper.getContext('2d')!
  c.fillStyle = PAL.paper
  c.fillRect(0, 0, VIEW_W, VIEW_H)
  const r = rng(77)
  c.fillStyle = 'rgba(74,68,60,0.05)'
  for (let i = 0; i < 900; i++) {
    c.fillRect(r() * VIEW_W, r() * VIEW_H, 1.4, 1.4)
  }
  return paper
}

export function render(ctx: CanvasRenderingContext2D, g: Game, input: InputState) {
  setSketchPhase(Math.floor(g.t * 5) % 3)
  ctx.clearRect(0, 0, VIEW_W, VIEW_H)
  ctx.drawImage(getPaper(), 0, 0)

  // câmera com limite nas bordas do mapa
  const camX = Math.max(VIEW_W / 2, Math.min(g.world.w * TILE - VIEW_W / 2, g.camX))
  const camY = Math.max(VIEW_H / 2, Math.min(g.world.h * TILE - VIEW_H / 2, g.camY))
  ctx.save()
  ctx.translate(Math.round(VIEW_W / 2 - camX), Math.round(VIEW_H / 2 - camY))

  drawFloor(ctx, g, camX, camY)
  for (const t of g.trevos) if (!t.taken) drawTrevoItem(ctx, t.x, t.y, g.t, t.seed)
  drawEntities(ctx, g, camX, camY)
  drawAttack(ctx, g)
  drawParticles(ctx, g)
  drawToasts(ctx, g)
  drawNpcPrompt(ctx, g)

  ctx.restore()

  drawHud(ctx, g)
  if (g.dialogue.open) drawDialogue(ctx, g)
  if (input.touchVisible && !g.dialogue.open) drawTouchControls(ctx, input)
  if (g.faintT > 0) drawFaint(ctx, g)
}

// ---- chão ----

function drawFloor(ctx: CanvasRenderingContext2D, g: Game, camX: number, camY: number) {
  const x0 = Math.max(0, Math.floor((camX - VIEW_W / 2) / TILE) - 1)
  const y0 = Math.max(0, Math.floor((camY - VIEW_H / 2) / TILE) - 1)
  const x1 = Math.min(g.world.w - 1, Math.ceil((camX + VIEW_W / 2) / TILE) + 1)
  const y1 = Math.min(g.world.h - 1, Math.ceil((camY + VIEW_H / 2) / TILE) + 1)

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const f = g.world.floor[ty][tx]
      const px = tx * TILE
      const py = ty * TILE
      const seed = tx * 131 + ty * 17
      const r = rng(seed)

      if (f === 'path') {
        ctx.fillStyle = PAL.path
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = 'rgba(74,68,60,0.13)'
        for (let i = 0; i < 3; i++) ctx.fillRect(px + r() * 26, py + r() * 26, 2.5, 2.5)
      } else if (f === 'water') {
        ctx.fillStyle = PAL.water
        ctx.fillRect(px, py, TILE, TILE)
        const wavePhase = Math.sin(g.t * 1.6 + tx * 1.3 + ty * 2.1) * 3
        ctx.strokeStyle = PAL.waterLine
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(px + 4 + wavePhase, py + 12)
        ctx.quadraticCurveTo(px + 12 + wavePhase, py + 8, px + 20 + wavePhase, py + 12)
        ctx.stroke()
      } else if (f === 'dark') {
        ctx.fillStyle = PAL.dark
        ctx.fillRect(px, py, TILE, TILE)
        if (r() < 0.4) {
          ctx.fillStyle = 'rgba(74,68,60,0.16)'
          ctx.beginPath()
          ctx.arc(px + 6 + r() * 20, py + 6 + r() * 20, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // grama = o próprio papel, com tiquinhos verdes espalhados
        if (r() < 0.5) {
          ctx.strokeStyle = r() < 0.25 ? PAL.grassDark : PAL.grass
          ctx.lineWidth = 1.6
          const gx = px + 4 + r() * 22
          const gy = py + 6 + r() * 20
          ctx.beginPath()
          ctx.moveTo(gx, gy + 5)
          ctx.lineTo(gx + 2, gy)
          ctx.moveTo(gx + 4, gy + 5)
          ctx.lineTo(gx + 5, gy + 1)
          ctx.stroke()
        }
      }
    }
  }
}

// ---- entidades (ordenadas pela base y) ----

function drawEntities(ctx: CanvasRenderingContext2D, g: Game, camX: number, camY: number) {
  type Item = { y: number; draw: () => void }
  const items: Item[] = []
  const margin = TILE * 3

  for (const d of g.world.decors) {
    // culling nos dois eixos: decor fora da tela nem entra na lista
    if (Math.abs(d.x - camX) > VIEW_W / 2 + margin || Math.abs(d.y - camY) > VIEW_H / 2 + margin) continue
    items.push({ y: d.y, draw: () => drawDecor(ctx, d, g.t) })
  }
  for (const n of g.npcs) {
    items.push({
      y: n.y,
      draw: () =>
        n.id === 'canela' ? drawCanela(ctx, n.x, n.y, g.t, n.seed, g.amizade) : drawLesma(ctx, n.x, n.y, g.t, n.seed),
    })
  }
  for (const b of g.blobs) {
    if (b.state === 'dead') continue
    items.push({ y: b.y, draw: () => drawBlob(ctx, b.x, b.y, g.t, b.seed, (g.player.x - b.x) / 40) })
  }
  const p = g.player
  const blink = p.iframes > 0 && Math.floor(g.t * 12) % 2 === 0
  const attackProg = p.attackT > 0 ? 1 - p.attackT / ATTACK_TIME : -1
  if (!blink)
    items.push({ y: p.y + 12, draw: () => drawNino(ctx, p.x, p.y + 12, g.t, p.walking, p.facing, 1, attackProg) })

  items.sort((a, b) => a.y - b.y)
  for (const it of items) it.draw()
}

function drawDecor(ctx: CanvasRenderingContext2D, d: Decor, t: number) {
  const s = d.seed
  if (d.kind === 'tree') {
    const sway = Math.sin(t * 1.2 + s) * 1.5
    sketchRect(ctx, d.x - 4, d.y - 18, 8, 16, s, PAL.trunk, PAL.pencil, 1.8)
    sketchEllipse(ctx, d.x + sway, d.y - 30, 17, 14, s + 1, rng(s)() < 0.5 ? PAL.treeLeaf : PAL.treeLeafDark, PAL.pencil, 2)
    sketchEllipse(ctx, d.x - 9 + sway, d.y - 22, 10, 8, s + 2, PAL.treeLeaf, null)
  } else if (d.kind === 'house') {
    const x = d.x + TILE / 2 // casas ocupam 2 tiles; centraliza
    sketchRect(ctx, x - 26, d.y - 34, 52, 34, s, '#efe0c0', PAL.pencil, 2.2)
    sketchPoly(ctx, [[x - 32, d.y - 34], [x, d.y - 58], [x + 32, d.y - 34]], s + 1, '#cf6b57', PAL.pencil, 2.2)
    sketchRect(ctx, x - 8, d.y - 20, 16, 20, s + 2, PAL.wood, PAL.pencil, 1.8)
    sketchEllipse(ctx, x - 16, d.y - 24, 5, 5, s + 3, PAL.water, PAL.pencil, 1.6)
    sketchLine(ctx, x - 21, d.y - 24, x - 11, d.y - 24, s + 4, PAL.pencil, 1.2, 0.5)
    sketchLine(ctx, x - 16, d.y - 29, x - 16, d.y - 19, s + 5, PAL.pencil, 1.2, 0.5)
  } else if (d.kind === 'rock') {
    sketchPoly(
      ctx,
      [
        [d.x - 13, d.y],
        [d.x - 9, d.y - 12],
        [d.x, d.y - 15],
        [d.x + 10, d.y - 10],
        [d.x + 13, d.y],
      ],
      s,
      PAL.rock,
      PAL.pencil,
      2,
    )
    sketchLine(ctx, d.x - 4, d.y - 10, d.x + 2, d.y - 5, s + 1, PAL.pencilSoft, 1.4, 0.8)
  } else if (d.kind === 'flower') {
    const r = rng(s)
    const color = r() < 0.5 ? PAL.flowerPink : PAL.flowerYellow
    sketchLine(ctx, d.x, d.y - 3, d.x, d.y - 11, s, PAL.grassDark, 1.6, 0.6)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.sin(t + s) * 0.06
      sketchEllipse(ctx, d.x + Math.cos(a) * 4, d.y - 14 + Math.sin(a) * 4, 3, 3, s + i, color, PAL.pencil, 1.2)
    }
    sketchEllipse(ctx, d.x, d.y - 14, 2.4, 2.4, s + 9, '#fff', PAL.pencil, 1)
  } else if (d.kind === 'mushroom') {
    sketchRect(ctx, d.x - 3, d.y - 8, 6, 7, s, '#f3ead6', PAL.pencil, 1.4)
    sketchEllipse(ctx, d.x, d.y - 10, 8, 5, s + 1, PAL.mushroom, PAL.pencil, 1.6)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(d.x - 3, d.y - 11, 1.3, 0, Math.PI * 2)
    ctx.arc(d.x + 3, d.y - 10, 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawTrevoItem(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number) {
  const bob = Math.sin(t * 3 + seed) * 2.5
  ctx.save()
  ctx.globalAlpha = 0.35
  sketchEllipse(ctx, x, y + 6, 8, 3, seed, PAL.pencilSoft, null)
  ctx.globalAlpha = 1
  drawClover(ctx, x, y - 6 + bob, 8, seed)
  // brilhinho
  const sp = Math.sin(t * 4 + seed * 2)
  if (sp > 0.6) {
    ctx.strokeStyle = PAL.flowerYellow
    ctx.lineWidth = 1.6
    const sx = x + 10
    const sy = y - 14 + bob
    ctx.beginPath()
    ctx.moveTo(sx - 3, sy)
    ctx.lineTo(sx + 3, sy)
    ctx.moveTo(sx, sy - 3)
    ctx.lineTo(sx, sy + 3)
    ctx.stroke()
  }
  ctx.restore()
}

function drawAttack(ctx: CanvasRenderingContext2D, g: Game) {
  // o bastão em si gira na mão do nino (drawNino); aqui ficam só o rastro e o impacto
  const p = g.player
  if (p.attackT <= 0) return
  const prog = 1 - p.attackT / ATTACK_TIME
  const [ax, ay] = g.attackPoint()
  ctx.save()
  ctx.globalAlpha = 1 - prog * 0.7
  const baseAngle = p.facing === 'up' ? -Math.PI / 2 : p.facing === 'down' ? Math.PI / 2 : p.facing === 'left' ? Math.PI : 0
  // p/ 'left' o bastão é espelhado (gira anti-horário na tela) — o rastro acompanha
  const dir = p.facing === 'left' ? -1 : 1
  ctx.strokeStyle = PAL.pencilSoft
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(p.x, p.y - 14, TILE * 0.95, baseAngle + dir * (-0.8 + prog * 1.1), baseAngle + dir * (-0.25 + prog * 1.1), dir < 0)
  ctx.stroke()
  // estrelinha no ponto do impacto
  if (prog < 0.4) {
    ctx.strokeStyle = PAL.flowerYellow
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ax - 5, ay - 14)
    ctx.lineTo(ax + 5, ay - 14)
    ctx.moveTo(ax, ay - 19)
    ctx.lineTo(ax, ay - 9)
    ctx.stroke()
  }
  ctx.restore()
}

function drawParticles(ctx: CanvasRenderingContext2D, g: Game) {
  for (const p of g.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawToasts(ctx: CanvasRenderingContext2D, g: Game) {
  ctx.save()
  ctx.font = `13px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle' // explícito: não herdar baseline de outro desenho
  for (const t of g.toasts) {
    ctx.globalAlpha = Math.min(1, t.life)
    ctx.fillStyle = PAL.banner
    const w = ctx.measureText(t.text).width + 14
    ctx.fillRect(t.x - w / 2, t.y - 12, w, 20)
    ctx.strokeStyle = PAL.pencil
    ctx.lineWidth = 1.4
    ctx.strokeRect(t.x - w / 2, t.y - 12, w, 20)
    ctx.fillStyle = PAL.pencil
    ctx.fillText(t.text, t.x, t.y - 2)
  }
  ctx.restore()
}

function drawNpcPrompt(ctx: CanvasRenderingContext2D, g: Game) {
  if (!g.nearNpc || g.dialogue.open) return
  const n = g.npcs.find((nn) => nn.id === g.nearNpc)!
  const bob = Math.sin(g.t * 4) * 2
  sketchEllipse(ctx, n.x, n.y - 52 + bob, 11, 11, 60, PAL.banner, PAL.pencil, 1.8)
  ctx.fillStyle = PAL.pencil
  ctx.font = `bold 13px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('e', n.x, n.y - 51 + bob)
  // amizade da canela: coraçõezinhos na cor do nível atual da bandana
  if (n.id === 'canela') {
    for (let i = 0; i < AMIZADE_MAX; i++) {
      const hx = n.x + (i - (AMIZADE_MAX - 1) / 2) * 11
      sketchHeart(ctx, hx, n.y - 70 + bob, 4, 61 + i, i < g.amizade, AMIZADE_CORES[g.amizade])
    }
  }
}

// ---- HUD ----

function drawHud(ctx: CanvasRenderingContext2D, g: Game) {
  // corações
  for (let i = 0; i < MAX_HEARTS; i++) {
    sketchHeart(ctx, 26 + i * 30, 26, 11, 70 + i, i < g.player.hearts)
  }
  // contador de trevos (aparece com a missão ativa)
  if (g.questStage !== 'pre') {
    drawClover(ctx, VIEW_W - 74, 24, 9, 71)
    ctx.fillStyle = PAL.pencil
    ctx.font = `bold 17px ${FONT}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${g.trevoCount}/${TOTAL_TREVOS}`, VIEW_W - 58, 26)
  }
  // dica de objetivo
  let hint: string | null = null
  if (g.questStage === 'pre') hint = 'fale com a canela (aperte e)'
  else if (g.questStage === 'active' && g.trevoCount >= TOTAL_TREVOS) hint = 'leve os trevos de volta pra canela!'
  else if (g.questStage === 'done') hint = '~ capítulo 1 completo ~'
  if (hint) {
    ctx.font = `13px ${FONT}`
    const w = ctx.measureText(hint).width + 18
    const x = VIEW_W / 2 - w / 2
    ctx.fillStyle = PAL.banner
    ctx.fillRect(x, 10, w, 24)
    ctx.strokeStyle = PAL.pencil
    ctx.lineWidth = 1.6
    ctx.strokeRect(x, 10, w, 24)
    ctx.fillStyle = g.questStage === 'done' ? PAL.clover : PAL.pencil
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(hint, VIEW_W / 2, 23)
  }
}

// ---- diálogo ----

function drawDialogue(ctx: CanvasRenderingContext2D, g: Game) {
  const line = g.dialogue.lines[g.dialogue.idx]
  const boxH = 108
  const y = VIEW_H - boxH - 14
  sketchRect(ctx, 14, y, VIEW_W - 28, boxH, 80, PAL.banner, PAL.pencil, 2.4)

  drawPortrait(ctx, line.who, 58, y + boxH / 2, g.amizade)

  ctx.fillStyle = line.who === 'canela' ? PAL.foxOrange : line.who === 'nino' ? PAL.ninoHoodRim : PAL.foxBand
  ctx.font = `bold 15px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(NPC_NAMES[line.who], 100, y + 12)

  // texto com máquina de escrever + quebra de linha
  ctx.fillStyle = PAL.pencil
  ctx.font = `15px ${FONT}`
  const shown = line.text.slice(0, Math.floor(g.dialogue.chars))
  const maxW = VIEW_W - 150
  const words = shown.split(' ')
  let cur = ''
  let ty = y + 36
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(cur, 100, ty)
      ty += 22
      cur = w
    } else cur = test
  }
  ctx.fillText(cur, 100, ty)

  // seta de avançar
  if (g.dialogue.chars >= line.text.length && Math.floor(g.t * 2.4) % 2 === 0) {
    ctx.fillStyle = PAL.pencil
    ctx.font = `15px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText('▼', VIEW_W - 34, y + boxH - 26)
  }
}

// ---- toque ----

function drawTouchControls(ctx: CanvasRenderingContext2D, input: InputState) {
  ctx.save()
  ctx.globalAlpha = 0.5
  sketchEllipse(ctx, DPAD.x, DPAD.y, DPAD.r, DPAD.r, 90, 'rgba(255,255,255,0.5)', PAL.pencil, 2)
  const knobX = DPAD.x + (input.dpadActive ? input.dpadDX * 26 : 0)
  const knobY = DPAD.y + (input.dpadActive ? input.dpadDY * 26 : 0)
  sketchEllipse(ctx, knobX, knobY, 22, 22, 91, 'rgba(255,255,255,0.85)', PAL.pencil, 2)

  sketchEllipse(ctx, BTN_A.x, BTN_A.y, BTN_A.r, BTN_A.r, 92, 'rgba(255,255,255,0.7)', PAL.pencil, 2)
  sketchEllipse(ctx, BTN_B.x, BTN_B.y, BTN_B.r, BTN_B.r, 93, 'rgba(255,255,255,0.7)', PAL.pencil, 2)
  ctx.globalAlpha = 0.85
  ctx.fillStyle = PAL.pencil
  ctx.font = `bold 12px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('falar', BTN_A.x, BTN_A.y)
  ctx.fillText('bastão', BTN_B.x, BTN_B.y)
  ctx.restore()
}

function drawFaint(ctx: CanvasRenderingContext2D, g: Game) {
  ctx.save()
  ctx.globalAlpha = Math.min(0.75, (2.2 - g.faintT) * 1.2)
  ctx.fillStyle = '#2c2825'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  ctx.globalAlpha = 1
  ctx.fillStyle = PAL.banner
  ctx.font = `17px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('você desmaiou... a canela te levou de volta pra vila 💤', VIEW_W / 2, VIEW_H / 2)
  ctx.restore()
}
