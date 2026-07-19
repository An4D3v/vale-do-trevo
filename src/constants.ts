// medidas do mundo e paleta — cores tiradas do desenho original dos personagens.

export const TILE = 32 // tamanho lógico de cada tile, em px
export const VIEW_W = 960
export const VIEW_H = 540

// paleta "canetinha no papel"
export const PAL = {
  paper: '#f7f2e6',
  pencil: '#4a443c',
  pencilSoft: 'rgba(74,68,60,0.45)',

  grass: '#7fb069',
  grassDark: '#5e8c4f',
  path: '#e6d2a8',
  water: '#a9d6e5',
  waterLine: '#5b9bb5',
  dark: '#d9cfc2', // chão do bioma das pedras
  rock: '#b3aca0',

  treeLeaf: '#6a994e',
  treeLeafDark: '#557c46',
  trunk: '#a97c50',

  flowerPink: '#f28ba8',
  flowerYellow: '#f4c95d',
  mushroom: '#d9594c',

  // nino, o ninja (personagem 1)
  ninoBody: '#3f4a6b',
  ninoBodyDark: '#333c58',
  ninoHoodRim: '#4caf50',
  ninoFace: '#f6bcc4',
  ninoBlush: '#ef9daa',
  ninoButton: '#4caf50',
  wood: '#c89b6a',

  // canela, a raposa (personagem 2)
  foxOrange: '#e8702a',
  foxOrangeDark: '#c95d1e',
  foxCream: '#f6dcb5',
  foxBand: '#8e44ad',

  snailShell: '#c9a7d8',
  snailBody: '#cbb89d',

  blob: '#57506b', // borrão de tinta (monstro)
  blobDark: '#403a52',

  heart: '#e05263',
  clover: '#3e8948',
  banner: '#fdf8ec',
} as const

// jogador
export const WALK_SPEED = 105 // px/s
export const ATTACK_TIME = 0.2 // golpe rápido
export const ATTACK_COOLDOWN = 0.2 // emenda um golpe no outro (spam de clique = combo)
export const ATTACK_BUFFER = 0.25 // clique durante um golpe fica guardado pro próximo
export const ATTACK_REACH = TILE * 1.1 // distância do centro do golpe
export const ATTACK_RADIUS = TILE * 1.3 // raio de acerto em volta do centro
export const IFRAMES = 1.2
export const MAX_HEARTS = 3

// borrões
export const BLOB_WANDER_SPEED = 48
export const BLOB_CHASE_SPEED = 74
export const BLOB_SIGHT = 4.5 * TILE
export const BLOB_RESPAWN = 25

export const TOTAL_TREVOS = 6

// evolução da canela: a bandana percorre o arco-íris conforme a amizade cresce
// (nível 5 = roxa, a cor do desenho original)
export const AMIZADE_MAX = 5
export const AMIZADE_CORES = ['#e05263', '#e8702a', '#f4c95d', '#4caf50', '#39c0ed', '#8e44ad'] as const
