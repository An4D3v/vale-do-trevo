// o mapa do vale — pintado por código (fácil de ajustar mexendo nos números).
// biomas: vila (oeste), lago (noroeste), floresta (norte/leste) e pedras (sudeste).

import { TILE } from './constants'
import { rng } from './sketch'
import type { WorldData, Floor, Decor } from './types'

export const MAP_W = 46
export const MAP_H = 38 // linhas 28+ são o subsolo (caverna do capítulo 2)

// região das pedras (bioma dos borrões)
export const ROCKY = { x0: 27, y0: 16, x1: 44, y1: 27 }
// caverna subterrânea do borrão-mor
export const CAVE = { x0: 1, y0: 29, x1: 44, y1: 36 }

export function insideRocky(tx: number, ty: number): boolean {
  return tx >= ROCKY.x0 && tx <= ROCKY.x1 && ty >= ROCKY.y0 && ty <= ROCKY.y1
}

export function insideCave(tx: number, ty: number): boolean {
  return tx >= CAVE.x0 && tx <= CAVE.x1 && ty >= CAVE.y0 && ty <= CAVE.y1
}

export function buildWorld(): WorldData {
  const floor: Floor[][] = []
  const solid: boolean[][] = []
  const decors: Decor[] = []
  const r = rng(20260719)

  for (let y = 0; y < MAP_H; y++) {
    floor.push(new Array(MAP_W).fill('grass'))
    solid.push(new Array(MAP_W).fill(false))
  }

  const setFloor = (x: number, y: number, f: Floor) => {
    if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) floor[y][x] = f
  }
  const setSolid = (x: number, y: number, s = true) => {
    if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) solid[y][x] = s
  }
  const addDecor = (kind: Decor['kind'], tx: number, ty: number) => {
    decors.push({ kind, x: (tx + 0.5) * TILE, y: (ty + 1) * TILE, seed: tx * 97 + ty * 13 })
  }
  const tree = (tx: number, ty: number) => {
    addDecor('tree', tx, ty)
    setSolid(tx, ty)
  }

  // ---- chão dos biomas ----
  for (let y = ROCKY.y0; y <= ROCKY.y1; y++)
    for (let x = ROCKY.x0; x <= ROCKY.x1; x++) setFloor(x, y, 'dark')
  // caverna do capítulo 2 (subsolo)
  for (let y = 28; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) setFloor(x, y, 'cave')

  // lago (noroeste)
  for (let y = 1; y <= 6; y++)
    for (let x = 2; x <= 9; x++) {
      const oval = (x - 5.5) ** 2 / 16 + (y - 3.5) ** 2 / 7
      if (oval <= 1) {
        setFloor(x, y, 'water')
        setSolid(x, y)
      }
    }

  // ---- bordas: árvores na superfície, pedras no subsolo ----
  const rock = (tx: number, ty: number) => {
    addDecor('rock', tx, ty)
    setSolid(tx, ty)
  }
  const borda = (tx: number, ty: number) => (ty >= 28 ? rock(tx, ty) : tree(tx, ty))
  for (let x = 0; x < MAP_W; x++) {
    tree(x, 0)
    rock(x, MAP_H - 1)
  }
  for (let y = 1; y < MAP_H - 1; y++) {
    borda(0, y)
    borda(MAP_W - 1, y)
    borda(MAP_W - 2, y) // borda leste mais grossa
  }

  // ---- muralha que separa a superfície da caverna (y=28), com a passagem fechada ----
  const gate: { x: number; y: number }[] = []
  for (let x = 1; x < MAP_W - 2; x++) {
    if (x === 33 || x === 34) {
      rock(x, 28)
      gate.push({ x, y: 28 }) // essas duas pedras somem quando o capítulo 2 abre
    } else {
      rock(x, 28)
    }
  }
  // pedrinhas decorativas espalhadas pela caverna
  // (fora do corredor de entrada x32-35 e da arena do chefe)
  for (let i = 0; i < 10; i++) {
    const x = 3 + Math.floor(r() * 40)
    const y = 30 + Math.floor(r() * 6)
    if (!solid[y]?.[x] && !(x >= 32 && x <= 35) && !(x > 26 && y > 31)) rock(x, y)
  }

  // ---- floresta (norte e leste) ----
  const forestSpots: [number, number][] = []
  for (let y = 1; y < 15; y++)
    for (let x = 17; x < MAP_W - 2; x++) {
      if (r() < 0.16) forestSpots.push([x, y])
    }
  for (let y = 15; y < ROCKY.y0; y++)
    for (let x = 30; x < MAP_W - 2; x++) {
      if (r() < 0.12) forestSpots.push([x, y])
    }
  for (const [x, y] of forestSpots) tree(x, y)
  // cogumelos da floresta (decoração, dá pra passar por cima)
  for (let i = 0; i < 14; i++) {
    const x = 18 + Math.floor(r() * 24)
    const y = 2 + Math.floor(r() * 11)
    if (!solid[y]?.[x]) addDecor('mushroom', x, y)
  }

  // ---- pedras no bioma escuro ----
  for (let i = 0; i < 16; i++) {
    const x = ROCKY.x0 + 1 + Math.floor(r() * (ROCKY.x1 - ROCKY.x0 - 2))
    const y = ROCKY.y0 + 1 + Math.floor(r() * (ROCKY.y1 - ROCKY.y0 - 2))
    if (!solid[y]?.[x]) {
      addDecor('rock', x, y)
      setSolid(x, y)
    }
  }

  // ---- caminhos (limpam árvores/pedras por onde passam) ----
  const carve = (x: number, y: number) => {
    setFloor(x, y, 'path')
    if (solid[y]?.[x]) {
      setSolid(x, y, false)
      // remove a decoração que estava aqui
      const cx = (x + 0.5) * TILE
      const cy = (y + 1) * TILE
      for (let i = decors.length - 1; i >= 0; i--) {
        if (Math.abs(decors[i].x - cx) < 1 && Math.abs(decors[i].y - cy) < 1) decors.splice(i, 1)
      }
    }
  }
  for (let x = 4; x <= 33; x++) carve(x, 11) // vila -> leste
  for (let y = 11; y <= 27; y++) carve(33, y) // desce pras pedras, até a muralha da caverna
  for (let y = 4; y <= 11; y++) carve(13, y) // sobe pro lago/lesma
  for (let x = 8; x <= 13; x++) carve(x, 4) // até a beira do lago

  // ---- vila ----
  const houses: [number, number][] = [
    [5, 8],
    [10, 8],
  ]
  for (const [hx, hy] of houses) {
    addDecor('house', hx, hy)
    setSolid(hx, hy)
    setSolid(hx + 1, hy)
    // decor da casa é desenhado 2 tiles de largura; o tile de cima fica livre visualmente
  }
  for (let i = 0; i < 12; i++) {
    const x = 2 + Math.floor(r() * 14)
    const y = 6 + Math.floor(r() * 9)
    if (!solid[y]?.[x] && floor[y][x] === 'grass') addDecor('flower', x, y)
  }

  // ---- itens e criaturas ----
  const trevos = [
    { x: 22, y: 3 }, // floresta norte
    { x: 38, y: 6 }, // floresta leste
    { x: 3, y: 13 }, // atrás da vila
    { x: 30, y: 24 }, // pedras
  ].map((t) => ({ x: (t.x + 0.5) * TILE, y: (t.y + 0.5) * TILE }))

  const blobs = [
    { x: 31, y: 19 },
    { x: 37, y: 22 },
    { x: 41, y: 18 },
    { x: 35, y: 25 },
  ].map((b) => ({ x: (b.x + 0.5) * TILE, y: (b.y + 0.5) * TILE }))

  // garante chão livre nos pontos importantes
  const clearTile = (tx: number, ty: number) => {
    if (solid[ty]?.[tx]) {
      setSolid(tx, ty, false)
      const cx = (tx + 0.5) * TILE
      const cy = (ty + 1) * TILE
      for (let i = decors.length - 1; i >= 0; i--) {
        if (Math.abs(decors[i].x - cx) < 1 && Math.abs(decors[i].y - cy) < 1) decors.splice(i, 1)
      }
    }
  }
  for (const t of trevos) clearTile(Math.floor(t.x / TILE), Math.floor(t.y / TILE))
  for (const b of blobs) clearTile(Math.floor(b.x / TILE), Math.floor(b.y / TILE))

  return {
    w: MAP_W,
    h: MAP_H,
    floor,
    solid,
    decors,
    playerStart: { x: 7.5 * TILE, y: 12 * TILE },
    npcs: [
      { id: 'canela', x: 6.5 * TILE, y: 10.6 * TILE, seed: 11 },
      { id: 'lesma', x: 11.5 * TILE, y: 3.6 * TILE, seed: 22 },
    ],
    blobs,
    trevos,
    gate,
    bossHome: { x: 34.5 * TILE, y: 34.5 * TILE },
  }
}

/** abre a passagem da caverna: some com as pedras do portão (capítulo 2) */
export function openGate(world: WorldData) {
  for (const gtile of world.gate) {
    world.solid[gtile.y][gtile.x] = false
    const cx = (gtile.x + 0.5) * TILE
    const cy = (gtile.y + 1) * TILE
    for (let i = world.decors.length - 1; i >= 0; i--) {
      if (Math.abs(world.decors[i].x - cx) < 1 && Math.abs(world.decors[i].y - cy) < 1) world.decors.splice(i, 1)
    }
  }
}

/** colisão AABB do mundo: pode ficar com o centro (px) nesse ponto? */
export function canStand(world: WorldData, x: number, y: number): boolean {
  // hitbox dos pés: 18x12 px centrada um pouco abaixo do centro
  const hw = 9
  const top = y + 2
  const bottom = y + 12
  for (const [px, py] of [
    [x - hw, top],
    [x + hw, top],
    [x - hw, bottom],
    [x + hw, bottom],
  ] as [number, number][]) {
    const tx = Math.floor(px / TILE)
    const ty = Math.floor(py / TILE)
    if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) return false
    if (world.solid[ty][tx]) return false
  }
  return true
}
