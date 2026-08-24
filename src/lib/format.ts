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
/**
 * Formata uma data "sem hora real" (measuredAt, stockDate, lastRecordAt...)
 * — o backend grava esses campos como meia-noite UTC
 * ("2026-08-24T00:00:00.000Z"), porque um `<input type="date">` manda só
 * "YYYY-MM-DD" e uma string ISO só-de-data é sempre interpretada como UTC
 * pelo `Date`, nunca como hora local. `new Date(iso).toLocaleDateString()`
 * então reconverte pro fuso local do navegador — em fusos atrás de UTC (ex.
 * America/Fortaleza, UTC-3), meia-noite UTC vira 21h do dia anterior, e a
 * data exibida "escorrega" um dia pra trás. Reinterpretar só a parte da
 * data como meia-noite LOCAL (sem o "Z") mantém o mesmo dia em qualquer
 * fuso. (`transferredAt` de Transferência não tem esse problema — é gravado
 * com meio-dia local, não meia-noite UTC, então nunca cruza a virada do dia.)
 */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const datePart = value.slice(0, 10);
  return new Date(`${datePart}T00:00:00`).toLocaleDateString('pt-BR');
}

export function formatGeneticCode(
  geneticCode: string | null | undefined,
  geneticGeneration: number | null | undefined,
): string {
  const code = geneticCode?.trim() || '';
  if (geneticGeneration === null || geneticGeneration === undefined) return code;
  return code ? `${code} · geração ${geneticGeneration}` : `geração ${geneticGeneration}`;
}
