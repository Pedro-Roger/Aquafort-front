import { PondType } from '../types';

/**
 * Nomenclatura oficial acordada com o cliente — ver REUNIAO_INSIGHTS.md,
 * seção "Nomenclatura correta para o sistema". Este é o ÚNICO mapa
 * enum -> label do sistema; não duplicar em outros componentes/páginas.
 */
export const POND_TYPE_LABELS: Record<PondType, string> = {
  PRE_BERCARIO: 'Pré-berçário',
  BERCARIO: 'Berçário',
  ENGORDA: 'Engorda',
  REPRODUTOR: 'Reprodutor',
};

export function getPondTypeLabel(type: PondType | string): string {
  return POND_TYPE_LABELS[type as PondType] ?? type;
}

/**
 * Sigla curta usada em cards/colunas apertadas (mapa de viveiros, povoamento).
 * Não é o prefixo real do código da fazenda (esse é PBC/VB/VE — ver
 * `inferPondTypeFromCode`); é uma abreviação de UI já em uso antes desta
 * limpeza. Mantida aqui como fonte única para não voltar a duplicar em
 * múltiplos arquivos como aconteceu com `POND_TYPE_LABELS`.
 */
export const POND_TYPE_SHORT_LABELS: Record<PondType, string> = {
  PRE_BERCARIO: 'BRÇ',
  BERCARIO: 'PC',
  ENGORDA: 'VE',
  REPRODUTOR: 'VE',
};

export function getPondTypeShortLabel(type: PondType | string): string {
  return POND_TYPE_SHORT_LABELS[type as PondType] ?? type;
}

/**
 * Infere o tipo do viveiro a partir do prefixo/faixa do código, seguindo a
 * estrutura real da fazenda (REUNIAO_INSIGHTS.md):
 *   PBC        -> Pré-berçário
 *   VB         -> Berçário
 *   VE 200-268 -> Engorda
 *   VE 300-316 -> Reprodutor
 *
 * Retorna `null` quando o código não bate com nenhuma faixa conhecida —
 * nesse caso não dá para validar a consistência entre código e tipo.
 */
export function inferPondTypeFromCode(code: string): PondType | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  if (normalized.startsWith('PBC')) return PondType.PRE_BERCARIO;
  if (normalized.startsWith('VB')) return PondType.BERCARIO;

  const veMatch = normalized.match(/^VE0*(\d+)$/);
  if (veMatch) {
    const num = Number(veMatch[1]);
    if (num >= 200 && num <= 268) return PondType.ENGORDA;
    if (num >= 300 && num <= 316) return PondType.REPRODUTOR;
  }

  return null;
}

/**
 * Confere se o tipo selecionado bate com o que o prefixo/faixa do código
 * indica. Retorna uma mensagem pronta pra exibir ao operador, ou `null`
 * quando está tudo certo (inclusive quando o código não permite inferir o
 * tipo com confiança — nesse caso não bloqueamos, só não validamos).
 */
export function pondCodeTypeMismatch(code: string, type: PondType): string | null {
  const inferred = inferPondTypeFromCode(code);
  if (!inferred || inferred === type) return null;
  return `O código ${code.trim().toUpperCase()} segue o padrão de "${getPondTypeLabel(inferred)}", mas o tipo selecionado é "${getPondTypeLabel(type)}".`;
}
