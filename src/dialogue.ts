// as conversas do capítulo 1 — tudo minúsculo, clima fofo de história em quadrinho.

import { TOTAL_TREVOS } from './constants'
import type { DialogueLine, NpcId, QuestStage } from './types'

export const NPC_NAMES: Record<NpcId | 'nino', string> = {
  nino: 'nino',
  canela: 'canela',
  lesma: 'dona lesma',
}

export function dialogueFor(npc: NpcId, stage: QuestStage, trevos: number): DialogueLine[] {
  if (npc === 'canela') {
    if (stage === 'pre') {
      return [
        { who: 'canela', text: 'nino! ainda bem que você acordou!' },
        { who: 'canela', text: 'um borrão de tinta gigante passou pelo vale espirrando manchas por tudo que é lado...' },
        { who: 'nino', text: '...então era por isso que o céu tava cinza no meu sonho.' },
        { who: 'canela', text: `e o pior: os ${TOTAL_TREVOS} trevos da sorte se espalharam! sem eles, as cores do vale vão desbotando.` },
        { who: 'canela', text: 'os borrõezinhos guardam alguns. um golpe do seu bastão resolve — sem dó, eles são só tinta!' },
        { who: 'canela', text: 'procura na floresta e nas pedras do sul. eu fico de olho na vila. boa sorte! ✿' },
      ]
    }
    if (stage === 'active') {
      if (trevos >= TOTAL_TREVOS) {
        return [
          { who: 'canela', text: 'você conseguiu!! os trevos! olha as cores do vale voltando!' },
          { who: 'nino', text: 'os borrões viraram só manchinha no papel. missão cumprida!' },
          { who: 'canela', text: 'você é o herói do vale, nino. isso pede um lanche especial na minha casa!' },
          { who: 'canela', text: '~ fim do capítulo 1 ~' },
        ]
      }
      if (trevos === 0) {
        return [
          { who: 'canela', text: 'os trevos brilham no chão, não tem como errar. e cuidado com os borrões nas pedras do sul!' },
        ]
      }
      return [
        { who: 'canela', text: `já achou ${trevos} de ${TOTAL_TREVOS} trevos! tá indo super bem.` },
        { who: 'canela', text: 'os que faltam devem estar na floresta ou com os borrões das pedras do sul.' },
      ]
    }
    return [
      { who: 'canela', text: 'o vale tá colorido de novo graças a você. 💚' },
      { who: 'canela', text: 'descansa um pouco! no próximo capítulo a gente descobre de onde veio o borrão gigante...' },
    ]
  }

  // dona lesma
  if (stage === 'done') {
    return [
      { who: 'lesma', text: 'sentiu? até a água do lago tá mais azul. bom trabalho, mocinho.' },
      { who: 'lesma', text: 'eu plantaria um jardim pra comemorar... mas na minha velocidade, só ano que vem.' },
    ]
  }
  return [
    { who: 'lesma', text: 'dizem que a tinta escorreu toda pras pedras do sul...' },
    { who: 'lesma', text: 'eu mesma ia dar uma olhada, mas no meu passo eu chego lá em três primaveras.' },
    { who: 'lesma', text: 'ah, e se vir um trevo brilhando, é só passar por cima que ele vai com você.' },
  ]
}
