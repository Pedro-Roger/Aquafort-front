import { PondType } from '../types';
import { POND_TYPE_LABELS, POND_TYPE_SHORT_LABELS } from '../lib/pondLabels';

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
  { kind: 'PRE_BERCARIO', label: POND_TYPE_LABELS.PRE_BERCARIO, shortLabel: POND_TYPE_SHORT_LABELS.PRE_BERCARIO, count: 4 },
  { kind: 'BERCARIO', label: POND_TYPE_LABELS.BERCARIO, shortLabel: POND_TYPE_SHORT_LABELS.BERCARIO, count: 4 },
  { kind: 'ENGORDA', label: POND_TYPE_LABELS.ENGORDA, shortLabel: POND_TYPE_SHORT_LABELS.ENGORDA, count: 9 },
];

function prefixForKind(kind: TankGroupKind) {
  return POND_TYPE_SHORT_LABELS[kind];
}

export function getPondTypeLabel(kind: TankGroupKind) {
  if (kind === 'PRE_BERCARIO') return POND_TYPE_LABELS.PRE_BERCARIO;
  if (kind === 'BERCARIO') return POND_TYPE_LABELS.BERCARIO;
  return POND_TYPE_LABELS.ENGORDA;
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
