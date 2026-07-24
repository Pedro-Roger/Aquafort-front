import React from 'react';
import type { PondStatus, CyclePhase } from '../../types';

type BadgeColor = 'gray' | 'yellow' | 'green' | 'blue' | 'red' | 'sky';

const colorMap: Record<BadgeColor, { bg: string; color: string }> = {
  gray:   { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
  yellow: { bg: 'rgba(14, 165, 233, 0.14)', color: '#075985' },
  green:  { bg: 'rgba(56, 189, 248, 0.14)', color: '#075985' },
  blue:   { bg: 'rgba(2, 132, 199, 0.14)', color: '#075985' },
  red:    { bg: 'rgba(220, 38, 38, 0.14)', color: '#991b1b' },
  sky:    { bg: 'rgba(14, 165, 233, 0.14)', color: '#075985' },
};

const pondStatusColor: Record<PondStatus, BadgeColor> = {
  VAZIO:       'gray',
  PREPARANDO:  'yellow',
  POVOADO:     'green',
  DESPESCANDO: 'sky',
  INATIVO:     'gray',
};

const cyclePhaseColor: Record<CyclePhase, BadgeColor> = {
  PREPARACAO:    'yellow',
  BERCARIO:      'blue',
  ENGORDA:       'green',
  PRE_COLHEITA:  'sky',
  ENCERRADO:     'gray',
};

const pondStatusLabel: Record<PondStatus, string> = {
  VAZIO:       'Vazio',
  PREPARANDO:  'Preparando',
  POVOADO:     'Povoado',
  DESPESCANDO: 'Despescando',
  INATIVO:     'Inativo',
};

const cyclePhaseLabel: Record<CyclePhase, string> = {
  PREPARACAO:   'Preparação',
  BERCARIO:     'Berçário',
  ENGORDA:      'Engorda',
  PRE_COLHEITA: 'Pré-Colheita',
  ENCERRADO:    'Encerrado',
};

interface BadgeProps {
  color?: BadgeColor;
  pondStatus?: PondStatus;
  cyclePhase?: CyclePhase;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ color, pondStatus, cyclePhase, children, style }: BadgeProps) {
  let resolvedColor: BadgeColor = color ?? 'gray';
  let label = children;

  if (pondStatus) {
    resolvedColor = pondStatusColor[pondStatus];
    label = label ?? pondStatusLabel[pondStatus];
  } else if (cyclePhase) {
    resolvedColor = cyclePhaseColor[cyclePhase];
    label = label ?? cyclePhaseLabel[cyclePhase];
  }

  const { bg, color: textColor } = colorMap[resolvedColor];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        backgroundColor: bg,
        color: textColor,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
