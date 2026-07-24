import { PondType } from '../types';

export type TankGroupKind = 'PRE_BERCARIO' | 'BERCARIO' | 'ENGORDA';

export interface TankGroupConfig {
  kind: TankGroupKind;
  label: string;
  shortLabel: string;
  count: number;
}

export interface GeneratedTank {
  id: string;
  code: string;
  kind: TankGroupKind;
  label: string;
  index: number;
}

export interface TankVisualProfile {
  width: number;
  height: number;
  scale: number;
  footprint: number;
}

export interface GeneratedGroup {
  kind: TankGroupKind;
  label: string;
  shortLabel: string;
  count: number;
  tanks: GeneratedTank[];
}

export const DEFAULT_TANK_CONFIGS: TankGroupConfig[] = [
  { kind: 'PRE_BERCARIO', label: 'Berçário', shortLabel: 'BRÇ', count: 4 },
  { kind: 'BERCARIO', label: 'Pré-cria', shortLabel: 'PC', count: 4 },
  { kind: 'ENGORDA', label: 'Viveiro de engorda', shortLabel: 'VE', count: 9 },
];

function prefixForKind(kind: TankGroupKind) {
  if (kind === 'PRE_BERCARIO') return 'BRÇ';
  if (kind === 'BERCARIO') return 'PC';
  return 'VE';
}

export function getPondTypeLabel(kind: TankGroupKind) {
  if (kind === 'PRE_BERCARIO') return 'Pré-berçário';
  if (kind === 'BERCARIO') return 'Pré-cria';
  return 'Viveiro de engorda';
}

export function getPondType(kind: TankGroupKind): PondType {
  if (kind === 'PRE_BERCARIO') return PondType.PRE_BERCARIO;
  if (kind === 'BERCARIO') return PondType.BERCARIO;
  return PondType.ENGORDA;
}

export function getTankVisualProfile(kind: TankGroupKind): TankVisualProfile {
  if (kind === 'PRE_BERCARIO') {
    return { width: 118, height: 68, scale: 1, footprint: 8024 };
  }
  if (kind === 'BERCARIO') {
    return { width: 152, height: 88, scale: 1.28, footprint: 13376 };
  }
  return { width: 198, height: 114, scale: 1.68, footprint: 22572 };
}

export function buildTankGroups(configs: TankGroupConfig[]): GeneratedGroup[] {
  return configs.map((config) => {
    const tanks = Array.from({ length: Math.max(0, Math.floor(config.count)) }, (_, index) => ({
      id: `${config.kind}-${index + 1}`,
      code: `${prefixForKind(config.kind)}-${String(index + 1).padStart(2, '0')}`,
      kind: config.kind,
      label: config.label,
      index: index + 1,
    }));

    return {
      kind: config.kind,
      label: config.label,
      shortLabel: config.shortLabel,
      count: config.count,
      tanks,
    };
  });
}
