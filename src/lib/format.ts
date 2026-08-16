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
