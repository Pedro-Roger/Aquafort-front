import { describe, expect, it } from 'vitest';
import { PondType } from '../types';
import {
  POND_TYPE_LABELS,
  POND_TYPE_SHORT_LABELS,
  getPondTypeLabel,
  getPondTypeShortLabel,
  inferPondTypeFromCode,
  pondCodeTypeMismatch,
} from './pondLabels';

const ALL_POND_TYPES = Object.values(PondType);

describe('POND_TYPE_LABELS / getPondTypeLabel', () => {
  it('matches the nomenclature agreed with the client (REUNIAO_INSIGHTS.md)', () => {
    expect(POND_TYPE_LABELS.PRE_BERCARIO).toBe('Pré-berçário');
    expect(POND_TYPE_LABELS.BERCARIO).toBe('Berçário');
    expect(POND_TYPE_LABELS.ENGORDA).toBe('Engorda');
    expect(POND_TYPE_LABELS.REPRODUTOR).toBe('Reprodutor');
  });

  it('resolves labels through the helper for every enum value', () => {
    expect(getPondTypeLabel(PondType.PRE_BERCARIO)).toBe('Pré-berçário');
    expect(getPondTypeLabel(PondType.BERCARIO)).toBe('Berçário');
    expect(getPondTypeLabel(PondType.ENGORDA)).toBe('Engorda');
    expect(getPondTypeLabel(PondType.REPRODUTOR)).toBe('Reprodutor');
  });

  it('falls back to the raw value for an unknown type instead of throwing', () => {
    expect(getPondTypeLabel('ALGO_INVALIDO')).toBe('ALGO_INVALIDO');
  });
});

describe('inferPondTypeFromCode', () => {
  it('infers Pré-berçário from a PBC code', () => {
    expect(inferPondTypeFromCode('PBC04')).toBe(PondType.PRE_BERCARIO);
  });

  it('infers Berçário from a VB code', () => {
    expect(inferPondTypeFromCode('VB105')).toBe(PondType.BERCARIO);
  });

  it('infers Engorda from a VE code in the 200-268 range', () => {
    expect(inferPondTypeFromCode('VE231')).toBe(PondType.ENGORDA);
  });

  it('infers Reprodutor from a VE code in the 300-316 range', () => {
    expect(inferPondTypeFromCode('VE301')).toBe(PondType.REPRODUTOR);
  });

  it('returns null for a VE code outside the known ranges', () => {
    expect(inferPondTypeFromCode('VE999')).toBeNull();
  });

  it('returns null for an empty or unrecognized code', () => {
    expect(inferPondTypeFromCode('')).toBeNull();
    expect(inferPondTypeFromCode('XPTO01')).toBeNull();
  });
});

describe('pondCodeTypeMismatch', () => {
  it('rejects PBC04 marked as Engorda — impossible on the real farm', () => {
    expect(pondCodeTypeMismatch('PBC04', PondType.ENGORDA)).not.toBeNull();
  });

  it('accepts VE231 marked as Engorda', () => {
    expect(pondCodeTypeMismatch('VE231', PondType.ENGORDA)).toBeNull();
  });

  it('accepts VE301 marked as Reprodutor', () => {
    expect(pondCodeTypeMismatch('VE301', PondType.REPRODUTOR)).toBeNull();
  });

  it('does not block a code outside the known ranges (nothing to validate against)', () => {
    expect(pondCodeTypeMismatch('VE999', PondType.ENGORDA)).toBeNull();
  });
});

describe('POND_TYPE_SHORT_LABELS / getPondTypeShortLabel', () => {
  it('has a short label for every pond type', () => {
    expect(POND_TYPE_SHORT_LABELS.PRE_BERCARIO).toBe('BRÇ');
    expect(POND_TYPE_SHORT_LABELS.BERCARIO).toBe('PC');
    expect(POND_TYPE_SHORT_LABELS.ENGORDA).toBe('VE');
    expect(POND_TYPE_SHORT_LABELS.REPRODUTOR).toBe('VE');
  });

  it('resolves the short label through the helper', () => {
    expect(getPondTypeShortLabel(PondType.PRE_BERCARIO)).toBe('BRÇ');
  });
});

/**
 * Trava a regressão que motivou esta limpeza: cinco mapas enum -> label
 * espalhados pelo código, dois com texto errado. Qualquer PondType novo (ou
 * qualquer lugar que volte a duplicar o mapa em vez de importar daqui) tem
 * que continuar tendo entrada nos DOIS mapas únicos — se alguém adicionar um
 * PondType e esquecer de um dos dois, este teste quebra.
 */
describe('coverage — fonte única não pode ficar incompleta', () => {
  it('every PondType has both a full label and a short label', () => {
    expect(ALL_POND_TYPES.length).toBeGreaterThan(0);
    for (const type of ALL_POND_TYPES) {
      expect(POND_TYPE_LABELS[type], `POND_TYPE_LABELS está sem entrada para ${type}`).toBeTypeOf('string');
      expect(POND_TYPE_LABELS[type].length).toBeGreaterThan(0);
      expect(POND_TYPE_SHORT_LABELS[type], `POND_TYPE_SHORT_LABELS está sem entrada para ${type}`).toBeTypeOf('string');
      expect(POND_TYPE_SHORT_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});
