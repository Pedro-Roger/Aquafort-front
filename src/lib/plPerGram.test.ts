import { describe, expect, it } from 'vitest';
import { PondType } from '../types';
import { averageWeightGToPlPerGram, isBercarioPondType, plPerGramToAverageWeightG } from './plPerGram';

describe('PL/grama <-> peso médio conversion (RN-09)', () => {
  it('converts PL/g to avg_weight_g using the campo reference (250 PL/g = 0.004 g)', () => {
    expect(plPerGramToAverageWeightG(250)).toBeCloseTo(0.004, 6);
  });

  it('converts avg_weight_g back to PL/g as the exact inverse', () => {
    expect(averageWeightGToPlPerGram(0.004)).toBeCloseTo(250, 6);
  });

  it('round-trips PL/g -> g -> PL/g without drift', () => {
    const plPerGram = 320;
    const weightG = plPerGramToAverageWeightG(plPerGram);
    expect(averageWeightGToPlPerGram(weightG)).toBeCloseTo(plPerGram, 6);
  });

  it('round-trips g -> PL/g -> g without drift', () => {
    const weightG = 18.4;
    const plPerGram = averageWeightGToPlPerGram(weightG);
    expect(plPerGramToAverageWeightG(plPerGram)).toBeCloseTo(weightG, 6);
  });

  it('treats zero, negative or non-finite PL/g as invalid input, not division by zero', () => {
    expect(plPerGramToAverageWeightG(0)).toBe(0);
    expect(plPerGramToAverageWeightG(-10)).toBe(0);
    expect(plPerGramToAverageWeightG(Number.NaN)).toBe(0);
  });

  it('treats zero, negative or non-finite avg_weight_g as invalid input', () => {
    expect(averageWeightGToPlPerGram(0)).toBe(0);
    expect(averageWeightGToPlPerGram(-1)).toBe(0);
    expect(averageWeightGToPlPerGram(Number.NaN)).toBe(0);
  });
});

describe('isBercarioPondType (RN-10)', () => {
  it('is true only for BERCARIO ponds', () => {
    expect(isBercarioPondType(PondType.BERCARIO)).toBe(true);
    expect(isBercarioPondType('BERCARIO')).toBe(true);
  });

  it('is false for engorda, reprodutor, pré-berçário and missing type', () => {
    expect(isBercarioPondType(PondType.ENGORDA)).toBe(false);
    expect(isBercarioPondType(PondType.REPRODUTOR)).toBe(false);
    expect(isBercarioPondType(PondType.PRE_BERCARIO)).toBe(false);
    expect(isBercarioPondType(undefined)).toBe(false);
    expect(isBercarioPondType(null)).toBe(false);
  });
});
