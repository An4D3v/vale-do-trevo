// "motor de rabisco": helpers que desenham formas com contorno tremido,
// como se tudo tivesse sido feito à mão com canetinha. o parâmetro `seed`
// deixa o tremido estável por forma; o `phase` (trocado ~5x/s) dá o efeito
// de animação "fervendo" de desenho riscado.

import { PAL } from './constants'

/** gerador determinístico (mulberry32) — mesmo seed, mesmo rabisco */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let phase = 0
export function setSketchPhase(p: number) {
  phase = p
}

function wobblyPoints(pts: [number, number][], seed: number, amp: number): [number, number][] {
  const r = rng(seed * 31 + phase * 7)
  const out: [number, number][] = []
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    const dist = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.max(1, Math.floor(dist / 7))
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      out.push([x1 + (x2 - x1) * t + (r() - 0.5) * amp, y1 + (y2 - y1) * t + (r() - 0.5) * amp])
    }
  }
  return out
}

function tracePath(ctx: CanvasRenderingContext2D, pts: [number, number][], close: boolean) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  if (close) ctx.closePath()
}

/** polígono fechado com preenchimento chapado e contorno tremido */
export function sketchPoly(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  seed: number,
  fill: string | null,
  stroke: string | null = PAL.pencil,
  lineWidth = 2,
  amp = 1.6,
) {
  const wob = wobblyPoints(pts, seed, amp)
  tracePath(ctx, wob, true)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

/** círculo/elipse rabiscado */
export function sketchEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  fill: string | null,
  stroke: string | null = PAL.pencil,
  lineWidth = 2,
) {
  const r = rng(seed * 31 + phase * 7)
  const n = Math.max(10, Math.floor((rx + ry) / 3))
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const jx = 1 + (r() - 0.5) * 0.09
    const jy = 1 + (r() - 0.5) * 0.09
    pts.push([cx + Math.cos(a) * rx * jx, cy + Math.sin(a) * ry * jy])
  }
  tracePath(ctx, pts, true)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

/** retângulo rabiscado (cantos levemente vivos, traço de canetinha) */
export function sketchRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  fill: string | null,
  stroke: string | null = PAL.pencil,
  lineWidth = 2,
) {
  sketchPoly(
    ctx,
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    seed,
    fill,
    stroke,
    lineWidth,
  )
}

/** linha solta tremida */
export function sketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  stroke: string = PAL.pencil,
  lineWidth = 2,
  amp = 1.6,
) {
  const r = rng(seed * 31 + phase * 7)
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(2, Math.floor(dist / 7))
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  for (let s = 1; s <= steps; s++) {
    const t = s / steps
    ctx.lineTo(x1 + (x2 - x1) * t + (r() - 0.5) * amp, y1 + (y2 - y1) * t + (r() - 0.5) * amp)
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.stroke()
}

/** coração desenhado à mão (HUD de vida) */
export function sketchHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  seed: number,
  filled: boolean,
) {
  const pts: [number, number][] = []
  const n = 22
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    // curva de coração paramétrica clássica
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    pts.push([cx + (hx / 16) * size, cy + (hy / 16) * size])
  }
  sketchPoly(ctx, pts, seed, filled ? PAL.heart : null, PAL.pencil, 2, 1.1)
}
