import { describe, expect, it } from 'vitest';
import { buildTankGroups, DEFAULT_TANK_CONFIGS, getTankVisualProfile } from './farmMap';

describe('buildTankGroups', () => {
  it('builds sequential tank codes for each group', () => {
    const groups = buildTankGroups(DEFAULT_TANK_CONFIGS);

    expect(groups[0].tanks).toHaveLength(4);
    expect(groups[0].tanks[0].code).toBe('BRÇ-01');
    expect(groups[1].tanks[0].code).toBe('PC-01');
    expect(groups[2].tanks[8].code).toBe('VE-09');
  });

  it('keeps zero or negative quantities empty', () => {
    const groups = buildTankGroups([
      { kind: 'PRE_BERCARIO', label: 'Berçário', shortLabel: 'BRÇ', count: -2 },
    ]);

    expect(groups[0].tanks).toHaveLength(0);
  });

  it('scales bigger tanks larger than smaller tanks', () => {
    const bercario = getTankVisualProfile('PRE_BERCARIO');
    const preCria = getTankVisualProfile('BERCARIO');
    const engorda = getTankVisualProfile('ENGORDA');

    expect(bercario.width).toBeLessThan(preCria.width);
    expect(preCria.width).toBeLessThan(engorda.width);
    expect(bercario.height).toBeLessThan(preCria.height);
    expect(preCria.height).toBeLessThan(engorda.height);
  });
});
