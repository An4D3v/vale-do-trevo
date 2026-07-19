// entrada do jogo: teclado (setas/wasd + e/espaço falar + x espada)
// e toque (direcional virtual à esquerda, botões à direita).

import { VIEW_W, VIEW_H } from './constants'

export interface InputState {
  moveX: number
  moveY: number
  actionPressed: boolean // falar / avançar conversa (consumido a cada frame)
  attackPressed: boolean // espada (consumido a cada frame)
  touchVisible: boolean
  dpadActive: boolean
  dpadDX: number
  dpadDY: number
  uiModal: boolean // diálogo/desmaio aberto: qualquer toque vira "avançar"
}

// posições dos controles de toque (coordenadas lógicas do canvas)
export const DPAD = { x: 92, y: VIEW_H - 92, r: 62 }
export const BTN_A = { x: VIEW_W - 66, y: VIEW_H - 64, r: 30 } // falar
export const BTN_B = { x: VIEW_W - 138, y: VIEW_H - 100, r: 26 } // espada
// raio de ACERTO dos botões (maior que o desenho: dedo no celular precisa de área generosa)
const BTN_HIT = 56

export function createInput(canvas: HTMLCanvasElement): InputState {
  const state: InputState = {
    moveX: 0,
    moveY: 0,
    actionPressed: false,
    attackPressed: false,
    touchVisible: false,
    dpadActive: false,
    dpadDX: 0,
    dpadDY: 0,
    uiModal: false,
  }

  const keys = new Set<string>()

  function recalcKeys() {
    let x = 0
    let y = 0
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1
    state.moveX = x
    state.moveY = y
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault()
    if (e.repeat) return
    keys.add(e.code)
    recalcKeys()
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') state.actionPressed = true
    if (e.code === 'KeyX' || e.code === 'KeyJ') state.attackPressed = true
  })
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code)
    recalcKeys()
  })
  window.addEventListener('blur', () => {
    keys.clear()
    recalcKeys()
  })

  // ---- toque ----
  const toCanvas = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * VIEW_W, ((e.clientY - r.top) / r.height) * VIEW_H]
  }
  let dpadPointer: number | null = null

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') {
      // clique do mouse também conta como "falar/avançar" (praticidade no desktop)
      state.actionPressed = true
      return
    }
    state.touchVisible = true
    const [x, y] = toCanvas(e)
    if (state.uiModal) {
      // com diálogo aberto os controles somem — qualquer toque só avança a conversa
      state.actionPressed = true
      e.preventDefault()
      return
    }
    const dA = Math.hypot(x - BTN_A.x, y - BTN_A.y)
    const dB = Math.hypot(x - BTN_B.x, y - BTN_B.y)
    if (dpadPointer === null && Math.hypot(x - DPAD.x, y - DPAD.y) <= DPAD.r * 1.35) {
      // só reivindica o direcional se estiver livre (2º dedo não rouba o 1º)
      dpadPointer = e.pointerId
      updateDpad(x, y)
    } else if (dA <= BTN_HIT || dB <= BTN_HIT) {
      if (dB < dA) state.attackPressed = true
      else state.actionPressed = true
    } else {
      state.actionPressed = true // toque em qualquer lugar também avança conversa
    }
    e.preventDefault()
  })
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dpadPointer) return
    const [x, y] = toCanvas(e)
    updateDpad(x, y)
  })
  const releaseDpad = (e: PointerEvent) => {
    if (e.pointerId !== dpadPointer) return
    dpadPointer = null
    state.dpadActive = false
    state.dpadDX = 0
    state.dpadDY = 0
  }
  canvas.addEventListener('pointerup', releaseDpad)
  canvas.addEventListener('pointercancel', releaseDpad)

  function updateDpad(x: number, y: number) {
    const dx = x - DPAD.x
    const dy = y - DPAD.y
    const d = Math.hypot(dx, dy)
    state.dpadActive = true
    if (d < 8) {
      state.dpadDX = 0
      state.dpadDY = 0
    } else {
      state.dpadDX = dx / Math.max(d, DPAD.r * 0.6)
      state.dpadDY = dy / Math.max(d, DPAD.r * 0.6)
    }
  }

  return state
}

/** direção final de movimento (teclado + direcional de toque), normalizada */
export function moveVector(s: InputState): [number, number] {
  let x = s.moveX + (s.dpadActive ? s.dpadDX : 0)
  let y = s.moveY + (s.dpadActive ? s.dpadDY : 0)
  const d = Math.hypot(x, y)
  if (d > 1) {
    x /= d
    y /= d
  }
  return [x, y]
}
