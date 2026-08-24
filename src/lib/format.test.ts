import { describe, expect, it } from 'vitest';
import { formatAreaHa, formatDateOnly, formatGeneticCode, formatNumberPtBr } from './format';

describe('formatDateOnly', () => {
  // measuredAt/stockDate/lastRecordAt arrive as UTC-midnight ISO strings
  // ("2026-08-24T00:00:00.000Z") because a date-only <input> has no time to
  // send. `new Date(iso).toLocaleDateString()` would reconvert to the
  // browser's local timezone — in one behind UTC (e.g. America/Fortaleza,
  // UTC-3) midnight UTC on the 24th lands at 21h on the 23rd, showing the
  // wrong day. Re-parsing the date part as local midnight (no "Z") keeps the
  // same calendar day the operator actually picked, in any timezone.
  it('keeps the same calendar day a UTC-midnight timestamp encodes', () => {
    expect(formatDateOnly('2026-08-24T00:00:00.000Z')).toBe('24/08/2026');
  });

  it('works from just the date part too, with no time component at all', () => {
    expect(formatDateOnly('2026-01-05')).toBe('05/01/2026');
  });

  it('is unaffected by a non-midnight time component (only the date part is read)', () => {
    expect(formatDateOnly('2026-08-24T15:47:31.000Z')).toBe('24/08/2026');
  });

  it('returns a dash for null/undefined/empty input', () => {
    expect(formatDateOnly(null)).toBe('—');
    expect(formatDateOnly(undefined)).toBe('—');
    expect(formatDateOnly('')).toBe('—');
  });
});

describe('formatAreaHa', () => {
  it('uses a comma as the decimal separator (pt-BR), not a dot', () => {
    expect(formatAreaHa(1.2)).toBe('1,20');
  });

  it('preserves up to 4 decimal places — the schema is Decimal(10,4)', () => {
    expect(formatAreaHa(1.2345)).toBe('1,2345');
  });

  it('does not truncate a 3-decimal value down to 2', () => {
    expect(formatAreaHa(0.354)).toBe('0,354');
  });

  it('pads whole numbers with 2 decimal places', () => {
    expect(formatAreaHa(5)).toBe('5,00');
  });

  it('accepts numeric strings (e.g. straight from a Decimal API response)', () => {
    expect(formatAreaHa('1.2')).toBe('1,20');
  });

  it('returns a dash for null/undefined/invalid input', () => {
    expect(formatAreaHa(null)).toBe('-');
    expect(formatAreaHa(undefined)).toBe('-');
    expect(formatAreaHa('não é número')).toBe('-');
  });
});

describe('formatNumberPtBr', () => {
  it('respects custom min/max digit options', () => {
    expect(formatNumberPtBr(2, { minDigits: 0, maxDigits: 0 })).toBe('2');
    expect(formatNumberPtBr(2.5, { minDigits: 1, maxDigits: 1 })).toBe('2,5');
  });
});

describe('formatGeneticCode', () => {
  it('combines code and generation (RF-18): "{código} · geração {geração}"', () => {
    expect(formatGeneticCode('APQS', 4)).toBe('APQS · geração 4');
  });

  it('falls back to just the code when generation is null', () => {
    expect(formatGeneticCode('APQS', null)).toBe('APQS');
  });

  it('falls back to just the code when generation is undefined', () => {
    expect(formatGeneticCode('APQS', undefined)).toBe('APQS');
  });

  it('returns an empty string when neither code nor generation is set', () => {
    expect(formatGeneticCode(null, null)).toBe('');
    expect(formatGeneticCode(undefined, undefined)).toBe('');
  });

  it('still shows the generation when the code is empty but generation is set', () => {
    expect(formatGeneticCode('', 4)).toBe('geração 4');
    expect(formatGeneticCode(null, 4)).toBe('geração 4');
  });
});
