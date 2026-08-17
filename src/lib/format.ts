/**
 * Formata um número no padrão pt-BR (vírgula decimal). Mantém até `maxDigits`
 * casas por padrão — importante para campos como área (schema Decimal(10,4)),
 * que não podem ser truncados para 2 casas fixas sem perder precisão real.
 */
export function formatNumberPtBr(
  value: number | string | null | undefined,
  options?: { minDigits?: number; maxDigits?: number },
): string {
  const { minDigits = 2, maxDigits = 4 } = options ?? {};
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === null || num === undefined || !Number.isFinite(num)) return '-';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
}

export function formatAreaHa(value: number | string | null | undefined): string {
  return formatNumberPtBr(value, { minDigits: 2, maxDigits: 4 });
}

/**
 * Combina código genético e geração no formato definido em RF-18/RN-11
 * (spec de Viveiros e Ciclos, "Ajustes — campo geração"): `"{código} · geração
 * {geração}"` quando a geração está preenchida, ou só o código quando não
 * está. `geneticGeneration` é campo independente de `geneticCode` — nunca
 * concatenado no texto livre, só combinado na exibição.
 */
export function formatGeneticCode(
  geneticCode: string | null | undefined,
  geneticGeneration: number | null | undefined,
): string {
  const code = geneticCode?.trim() || '';
  if (geneticGeneration === null || geneticGeneration === undefined) return code;
  return code ? `${code} · geração ${geneticGeneration}` : `geração ${geneticGeneration}`;
}
