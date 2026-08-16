import { describe, expect, it } from 'vitest';
import { formatAreaHa, formatNumberPtBr } from './format';

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
