// modo "minecraft mobile": no celular o jogo roda em tela cheia e deitado.
// android: Fullscreen API + screen.orientation.lock('landscape').
// ios (não deixa travar orientação): gira o jogo via css quando o aparelho está em pé.

const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
const isPortrait = () => matchMedia('(orientation: portrait)').matches

// lock/unlock saíram do lib.dom do TS, mas existem nos Androids — acesso defensivo
type OrientationLock = { lock?: (o: string) => Promise<void>; unlock?: () => void }
const orientation = () => screen.orientation as unknown as OrientationLock

export function setupMobileFullscreen(frame: HTMLElement, canvas: HTMLCanvasElement) {
  if (!isTouch()) return

  const btn = document.createElement('button')
  btn.className = 'fs-btn'
  btn.title = 'tela cheia'
  btn.textContent = '⛶'
  frame.appendChild(btn)

  const overlay = document.createElement('button')
  overlay.className = 'fs-overlay'
  overlay.innerHTML = '<span class="fs-icon">📱↻</span><span>toca pra jogar em tela cheia, deitado</span>'
  document.body.appendChild(overlay)

  const active = () => !!document.fullscreenElement || frame.classList.contains('force-land')

  function forceLandscape(on: boolean) {
    frame.classList.toggle('force-land', on)
    canvas.dataset.rot = on ? '1' : '' // o input lê isso p/ girar as coordenadas do toque
  }

  function sync() {
    overlay.style.display = isPortrait() && !active() ? 'flex' : 'none'
    btn.textContent = active() ? '✕' : '⛶'
    btn.title = active() ? 'sair da tela cheia' : 'tela cheia'
  }

  async function enter() {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      /* ios antigo etc. — segue só com o giro por css */
    }
    try {
      await orientation().lock?.('landscape')
    } catch {
      /* sem lock (ios): gira na mão se estiver em pé */
    }
    if (isPortrait()) forceLandscape(true)
    sync()
  }

  function exit() {
    try {
      orientation().unlock?.()
    } catch {
      /* ignora */
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    forceLandscape(false)
    sync()
  }

  btn.addEventListener('click', () => (active() ? exit() : enter()))
  overlay.addEventListener('click', () => enter())

  document.addEventListener('fullscreenchange', () => {
    // saiu da tela cheia pelo gesto do sistema (voltar etc.): desfaz tudo
    if (!document.fullscreenElement) {
      try {
        orientation().unlock?.()
      } catch {
        /* ignora */
      }
      forceLandscape(false)
    }
    sync()
  })

  matchMedia('(orientation: portrait)').addEventListener('change', () => {
    if (!isPortrait()) {
      forceLandscape(false) // deitou de verdade: giro por css não é mais necessário
    } else if (document.fullscreenElement) {
      forceLandscape(true) // em tela cheia sem lock (ios) e voltou pra pé: gira de novo
    }
    sync()
  })

  sync()
}
