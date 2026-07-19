// os personagens, desenhados à mão em canvas a partir da arte original:
// nino (ninja gorducho de trevo na cabeça) e canela (raposa de bandana).

import { PAL } from './constants'
import { sketchEllipse, sketchPoly, sketchRect, sketchLine, rng } from './sketch'
import type { Facing } from './types'

/** trevo de 4 folhas (item e enfeite do nino) */
export function drawClover(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, seed: number) {
  sketchLine(ctx, cx, cy + size * 0.2, cx, cy + size * 0.9, seed + 9, PAL.clover, 2, 0.8)
  const leaves: [number, number][] = [
    [0, -size * 0.45],
    [size * 0.45, 0],
    [0, size * 0.45],
    [-size * 0.45, 0],
  ]
  for (let i = 0; i < 4; i++) {
    sketchEllipse(ctx, cx + leaves[i][0], cy + leaves[i][1], size * 0.36, size * 0.36, seed + i, PAL.clover, PAL.pencil, 1.6)
  }
}

/**
 * nino, o player. `t` anima (bob/passos), `walking` liga as perninhas,
 * `facing` espelha o lado da espada.
 */
export function drawNino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number, // base (pés)
  t: number,
  walking: boolean,
  facing: Facing,
  seed = 1,
) {
  const bob = walking ? Math.sin(t * 11) * 1.8 : Math.sin(t * 2.2) * 0.9
  const flip = facing === 'left' ? -1 : 1
  ctx.save()
  ctx.translate(x, y + bob)
  ctx.scale(flip, 1)

  // sombra
  ctx.fillStyle = 'rgba(74,68,60,0.14)'
  ctx.beginPath()
  ctx.ellipse(0, -bob + 1, 15, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // perninhas
  const step = walking ? Math.sin(t * 11) * 3 : 0
  sketchEllipse(ctx, -7, -3 + step, 5, 4, seed + 5, PAL.ninoBodyDark, PAL.pencil, 1.6)
  sketchEllipse(ctx, 7, -3 - step, 5, 4, seed + 6, PAL.ninoBodyDark, PAL.pencil, 1.6)

  // cabo da espada de madeira (na cintura)
  ctx.save()
  ctx.translate(14, -20)
  ctx.rotate(0.6)
  sketchRect(ctx, -2.5, -9, 5, 14, seed + 7, PAL.wood, PAL.pencil, 1.6)
  sketchLine(ctx, -4, -9, 4, -9, seed + 8, PAL.pencil, 2, 0.6)
  ctx.restore()

  // corpo gorducho
  sketchEllipse(ctx, 0, -22, 17, 20, seed, PAL.ninoBody, PAL.pencil, 2.2)
  // botão verde
  sketchEllipse(ctx, 0, -16, 3.6, 3.6, seed + 1, PAL.ninoButton, PAL.pencil, 1.5)
  sketchLine(ctx, -1.4, -16, 1.4, -16, seed + 12, PAL.pencil, 1, 0.4)

  // abertura do capuz com aro verde + rosto rosa
  sketchEllipse(ctx, 0, -30, 10.5, 9.5, seed + 2, PAL.ninoHoodRim, PAL.pencil, 2)
  sketchEllipse(ctx, 0, -30, 8, 7.2, seed + 3, PAL.ninoFace, PAL.pencil, 1.6)

  // olhinhos + bochechas (sempre virados pro lado do movimento)
  ctx.fillStyle = PAL.pencil
  const look = facing === 'up' ? 0 : 1.5
  ctx.beginPath()
  ctx.arc(-2.6 + look, -31, 1.3, 0, Math.PI * 2)
  ctx.arc(2.6 + look, -31, 1.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PAL.ninoBlush
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.arc(-4.5 + look, -28, 1.6, 0, Math.PI * 2)
  ctx.arc(4.5 + look, -28, 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // trevo na cabeça
  drawClover(ctx, 1, -45, 6, seed + 4)

  ctx.restore()
}

/** canela, a raposa de bandana roxa */
export function drawCanela(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed = 2) {
  const sway = Math.sin(t * 1.8 + seed) * 1.2
  ctx.save()
  ctx.translate(x, y)

  ctx.fillStyle = 'rgba(74,68,60,0.14)'
  ctx.beginPath()
  ctx.ellipse(0, 1, 14, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // rabo (atrás), com pontinha creme
  ctx.save()
  ctx.translate(-13, -14)
  ctx.rotate(-0.5 + sway * 0.06)
  sketchEllipse(ctx, 0, 0, 11, 6, seed + 1, PAL.foxOrange, PAL.pencil, 2)
  sketchEllipse(ctx, -8, -1, 4.5, 4, seed + 2, PAL.foxCream, PAL.pencil, 1.6)
  ctx.restore()

  // perninhas
  sketchEllipse(ctx, -6, -2, 4.5, 3.5, seed + 11, PAL.foxOrangeDark, PAL.pencil, 1.6)
  sketchEllipse(ctx, 6, -2, 4.5, 3.5, seed + 12, PAL.foxOrangeDark, PAL.pencil, 1.6)

  // corpo + barriga creme
  sketchEllipse(ctx, 0, -14, 12, 13, seed + 3, PAL.foxOrange, PAL.pencil, 2.2)
  sketchEllipse(ctx, 0, -12, 7, 9, seed + 4, PAL.foxCream, null)

  // bracinho com luva branca (joinha!)
  sketchEllipse(ctx, 12 + sway * 0.4, -18, 3.6, 3.2, seed + 5, '#ffffff', PAL.pencil, 1.6)

  // orelhas
  sketchPoly(ctx, [[-9, -36], [-3, -28], [-12, -28]], seed + 6, PAL.foxOrange, PAL.pencil, 2)
  sketchPoly(ctx, [[9, -36], [12, -28], [3, -28]], seed + 7, PAL.foxOrange, PAL.pencil, 2)

  // cabeça
  sketchEllipse(ctx, 0, -26, 10.5, 9, seed + 8, PAL.foxOrange, PAL.pencil, 2.2)
  // bandana roxa
  sketchRect(ctx, -10, -31, 20, 4.5, seed + 9, PAL.foxBand, PAL.pencil, 1.6)
  sketchLine(ctx, 10, -29, 15, -25, seed + 13, PAL.foxBand, 3, 1)
  // focinho creme + nariz
  sketchEllipse(ctx, 0, -22.5, 5.5, 4.2, seed + 10, PAL.foxCream, PAL.pencil, 1.4)
  ctx.fillStyle = PAL.pencil
  ctx.beginPath()
  ctx.arc(0, -23.5, 1.5, 0, Math.PI * 2)
  ctx.fill()
  // olhos (piscada de vez em quando)
  const blink = Math.sin(t * 0.7 + seed) > 0.97
  if (blink) {
    sketchLine(ctx, -5.5, -27, -2.5, -27, seed + 14, PAL.pencil, 1.6, 0.4)
    sketchLine(ctx, 2.5, -27, 5.5, -27, seed + 15, PAL.pencil, 1.6, 0.4)
  } else {
    ctx.beginPath()
    ctx.arc(-4, -27, 1.4, 0, Math.PI * 2)
    ctx.arc(4, -27, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** dona lesma, moradora da beira do lago */
export function drawLesma(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed = 3) {
  const stretch = Math.sin(t * 1.4) * 0.8
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(74,68,60,0.12)'
  ctx.beginPath()
  ctx.ellipse(0, 1, 13, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  // corpo
  sketchEllipse(ctx, -2, -4, 12, 5, seed, PAL.snailBody, PAL.pencil, 1.8)
  sketchEllipse(ctx, 8 + stretch, -9, 4, 5, seed + 1, PAL.snailBody, PAL.pencil, 1.8)
  // antenas
  sketchLine(ctx, 7 + stretch, -13, 5 + stretch, -18, seed + 2, PAL.pencil, 1.6, 0.6)
  sketchLine(ctx, 10 + stretch, -13, 12 + stretch, -18, seed + 3, PAL.pencil, 1.6, 0.6)
  ctx.fillStyle = PAL.pencil
  ctx.beginPath()
  ctx.arc(5 + stretch, -18, 1.2, 0, Math.PI * 2)
  ctx.arc(12 + stretch, -18, 1.2, 0, Math.PI * 2)
  ctx.fill()
  // casco espiral
  sketchEllipse(ctx, -4, -12, 8.5, 8, seed + 4, PAL.snailShell, PAL.pencil, 2)
  ctx.strokeStyle = PAL.pencil
  ctx.lineWidth = 1.4
  ctx.beginPath()
  for (let a = 0; a < Math.PI * 3.5; a += 0.3) {
    const rr = 1 + a * 1.6
    const px = -4 + Math.cos(a) * rr
    const py = -12 + Math.sin(a) * rr * 0.9
    if (a === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}

/** borrão de tinta (o "monstrinho" que manchou o desenho) */
export function drawBlob(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number, lookX: number) {
  const squash = 1 + Math.sin(t * 6 + seed) * 0.08
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(74,68,60,0.14)'
  ctx.beginPath()
  ctx.ellipse(0, 1, 13, 4.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.scale(squash, 2 - squash)
  // blob de tinta: três bolhas sobrepostas
  sketchEllipse(ctx, 0, -11, 13, 11, seed, PAL.blob, PAL.blobDark, 2.2)
  sketchEllipse(ctx, -7, -15, 6, 5, seed + 1, PAL.blob, null)
  sketchEllipse(ctx, 7, -16, 5, 4.5, seed + 2, PAL.blob, null)
  // gotinha escorrendo
  const drip = rng(seed)() * 8 - 4
  sketchEllipse(ctx, drip, -2.5, 2.2, 3, seed + 3, PAL.blob, null)
  // olhos brancos olhando pro player
  const dx = Math.max(-2.5, Math.min(2.5, lookX))
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(-4.5, -13, 3.4, 4, 0, 0, Math.PI * 2)
  ctx.ellipse(4.5, -13, 3.4, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PAL.blobDark
  ctx.beginPath()
  ctx.arc(-4.5 + dx, -12.5, 1.5, 0, Math.PI * 2)
  ctx.arc(4.5 + dx, -12.5, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---- retratos p/ caixa de diálogo ----

export function drawPortrait(ctx: CanvasRenderingContext2D, who: 'nino' | 'canela' | 'lesma', cx: number, cy: number) {
  ctx.save()
  // moldura circular de papel
  sketchEllipse(ctx, cx, cy, 26, 26, 40, '#ffffff', PAL.pencil, 2.2)
  ctx.beginPath()
  ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.clip()
  if (who === 'nino') {
    sketchEllipse(ctx, cx, cy + 22, 24, 20, 41, PAL.ninoBody, PAL.pencil, 2)
    sketchEllipse(ctx, cx, cy - 2, 16, 15, 42, PAL.ninoHoodRim, PAL.pencil, 2)
    sketchEllipse(ctx, cx, cy - 2, 12.5, 11.5, 43, PAL.ninoFace, PAL.pencil, 1.6)
    ctx.fillStyle = PAL.pencil
    ctx.beginPath()
    ctx.arc(cx - 4, cy - 4, 1.8, 0, Math.PI * 2)
    ctx.arc(cx + 4, cy - 4, 1.8, 0, Math.PI * 2)
    ctx.fill()
    drawClover(ctx, cx + 1, cy - 20, 7, 44)
  } else if (who === 'canela') {
    sketchPoly(ctx, [[cx - 14, cy - 22], [cx - 5, cy - 8], [cx - 20, cy - 8]], 45, PAL.foxOrange, PAL.pencil, 2)
    sketchPoly(ctx, [[cx + 14, cy - 22], [cx + 20, cy - 8], [cx + 5, cy - 8]], 46, PAL.foxOrange, PAL.pencil, 2)
    sketchEllipse(ctx, cx, cy + 2, 17, 15, 47, PAL.foxOrange, PAL.pencil, 2)
    sketchRect(ctx, cx - 16, cy - 7, 32, 6, 48, PAL.foxBand, PAL.pencil, 1.8)
    sketchEllipse(ctx, cx, cy + 8, 9, 7, 49, PAL.foxCream, PAL.pencil, 1.4)
    ctx.fillStyle = PAL.pencil
    ctx.beginPath()
    ctx.arc(cx - 6, cy + 1, 1.8, 0, Math.PI * 2)
    ctx.arc(cx + 6, cy + 1, 1.8, 0, Math.PI * 2)
    ctx.arc(cx, cy + 6, 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    sketchEllipse(ctx, cx + 2, cy + 12, 16, 8, 50, PAL.snailBody, PAL.pencil, 1.8)
    sketchEllipse(ctx, cx - 4, cy, 13, 12, 51, PAL.snailShell, PAL.pencil, 2)
    sketchLine(ctx, cx + 10, cy - 2, cx + 8, cy - 12, 52, PAL.pencil, 1.6, 0.6)
    sketchLine(ctx, cx + 14, cy - 2, cx + 16, cy - 12, 53, PAL.pencil, 1.6, 0.6)
    ctx.fillStyle = PAL.pencil
    ctx.beginPath()
    ctx.arc(cx + 8, cy - 12, 1.4, 0, Math.PI * 2)
    ctx.arc(cx + 16, cy - 12, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
