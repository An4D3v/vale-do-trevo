// as conversas do capítulo 1 — tudo minúsculo, clima fofo de história em quadrinho.

import { TOTAL_TREVOS } from './constants'
import type { Chapter2, DialogueLine, NpcId, QuestStage, Speaker } from './types'

export const NPC_NAMES: Record<Speaker, string> = {
  nino: 'nino',
  canela: 'canela',
  lesma: 'dona lesma',
  gota: 'gota',
  borrao: 'borrão-mor',
}

/** cutscenes do capítulo 2 (disparam sozinhas na caverna) */
export function cutsceneFor(kind: 'despertar' | 'derrota'): DialogueLine[] {
  if (kind === 'despertar') {
    return [
      { who: 'borrao', text: 'GRRRR... quem ousa entrar no meu escuro?!' },
      { who: 'nino', text: 'foi você que espirrou tinta no vale inteiro! por quê?' },
      { who: 'borrao', text: 'as cores... se EU não posso ter cores, NINGUÉM PODE!' },
    ]
  }
  return [
    { who: 'borrao', text: '...para... por favor... para...' },
    { who: 'borrao', text: 'eu era um desenho, sabia? me riscaram todo e me jogaram fora. desde então a tinta escorre e não para mais...' },
    { who: 'nino', text: '...ninguém nunca te desenhou de novo, né?' },
    { who: 'nino', text: 'vem comigo. no vale a gente desenha todo mundo, todo dia. até borrão.' },
    { who: 'borrao', text: '...posso mesmo...?' },
  ]
}

export function dialogueFor(
  npc: NpcId,
  stage: QuestStage,
  trevos: number,
  amizade = 0,
  cap2: Chapter2 = 'locked',
): DialogueLine[] {
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
        { who: 'canela', text: 'e repara na minha bandana... ela muda de cor conforme a nossa amizade cresce!' },
      ]
    }
    // capítulo 1 completo: a canela puxa o capítulo 2
    if (cap2 === 'locked') {
      return [
        { who: 'canela', text: 'nino! sentiu o chão tremer essa noite?' },
        { who: 'canela', text: 'vinha lá do fundo das pedras do sul. de manhã tinha uma PASSAGEM aberta, descendo pro escuro...' },
        { who: 'nino', text: 'o borrão gigante. só pode ser ele.' },
        { who: 'canela', text: 'leva o bastão e volta inteiro, tá? a bandana não combina com preocupação.' },
      ]
    }
    if (cap2 === 'open' || cap2 === 'boss') {
      return [
        { who: 'canela', text: 'a passagem fica no fundo das pedras do sul, descendo pro subsolo.' },
        { who: 'canela', text: 'respira fundo antes de entrar. e conta comigo aqui em cima. 💜' },
      ]
    }
    // cap2 done
    const fim: DialogueLine[] = [
      { who: 'canela', text: 'então o borrão-mor era só... um desenho abandonado. que aperto no coração.' },
      { who: 'canela', text: 'você não derrotou um monstro, nino. você fez um amigo. isso é bem mais difícil.' },
    ]
    if (amizade >= 5) {
      fim.push({ who: 'canela', text: 'e a bandana ROXA concorda: melhor amigo é pra sempre. ~ fim do capítulo 2 ~ 💜' })
    } else {
      fim.push({ who: 'canela', text: '~ fim do capítulo 2 ~ (e a bandana ainda pode mudar de cor, hein!)' })
    }
    return fim
  }

  if (npc === 'gota') {
    return [
      { who: 'gota', text: 'oi... eu tô treinando manchar menos. a dona lesma me ensinou a respirar devagar.' },
      { who: 'gota', text: 'a canela desenhou um trevo pra mim. agora ele é meu. pra sempre.' },
      { who: 'gota', text: 'obrigado por não desistir de mim, nino.' },
    ]
  }

  // dona lesma
  if (stage === 'done') {
    if (cap2 === 'done') {
      return [
        { who: 'lesma', text: 'aquele grandão chorava de solidão. dava pra ouvir daqui, sabia?' },
        { who: 'lesma', text: 'agora vive rindo na vila. quem diria que o remédio era um amigo.' },
      ]
    }
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
