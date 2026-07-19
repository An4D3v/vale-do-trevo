// bootstrap: canvas + input + loop do jogo.
import './style.css'
import { VIEW_W, VIEW_H } from './constants'
import { Game } from './game'
import { render } from './render'
import { createInput } from './input'
import { setupMobileFullscreen } from './fullscreen'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div class="frame">
    <canvas id="game"></canvas>
    <p class="hint">setas/wasd = andar · e ou espaço = falar · x = espada · no celular: controles na tela</p>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!
const dpr = Math.min(window.devicePixelRatio || 1, 2)
canvas.width = VIEW_W * dpr
canvas.height = VIEW_H * dpr
ctx.scale(dpr, dpr)

const game = new Game()
const input = createInput(canvas)
setupMobileFullscreen(document.querySelector<HTMLDivElement>('.frame')!, canvas)

// hooks de teste (só com ?debug na url): permitem simular e capturar frames
// mesmo sem requestAnimationFrame (ex.: aba em segundo plano)
if (location.search.includes('debug')) {
  const w = window as unknown as Record<string, unknown>
  w.__game = game
  w.__input = input
  w.__render = () => render(ctx, game, input)
  w.__shot = (scale = 0.5, quality = 0.6) => {
    render(ctx, game, input)
    const off = document.createElement('canvas')
    off.width = VIEW_W * scale
    off.height = VIEW_H * scale
    const oc = off.getContext('2d')!
    oc.drawImage(canvas, 0, 0, off.width, off.height)
    return off.toDataURL('image/jpeg', quality)
  }
}

let last = performance.now()
function frame(now: number) {
  let dt = (now - last) / 1000
  last = now
  if (dt > 1 / 30) dt = 1 / 30 // evita saltos ao voltar de aba inativa
  game.update(dt, input)
  render(ctx, game, input)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
