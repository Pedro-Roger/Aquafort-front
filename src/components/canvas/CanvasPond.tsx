import { useCallback, useRef, useState } from 'react';
import { CanvasAerator } from './CanvasAerator';
import type { Aerator, PondWithCanvas } from '../../types';
import { formatAreaHa } from '../../lib/format';

const STATUS_BG: Record<string, string> = {
  VAZIO: '#ffffff',
  PREPARANDO: '#eff6ff',
  POVOADO: '#e0f2fe',
  DESPESCANDO: '#e0f2fe',
  INATIVO: '#f8fafc',
};

const STATUS_BORDER: Record<string, string> = {
  VAZIO: '#94a3b8',
  PREPARANDO: '#7dd3fc',
  POVOADO: '#38bdf8',
  DESPESCANDO: '#0ea5e9',
  INATIVO: '#cbd5e1',
};

interface Props {
  pond: PondWithCanvas;
  scale: number;
  isSelected: boolean;
  onClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onAeratorsChange: (id: string, aerators: Aerator[]) => void;
  onDragEnd: (id: string) => Promise<void> | void;
}

export function CanvasPond({ pond, scale, isSelected, onClick, onMove, onResize, onAeratorsChange, onDragEnd }: Props) {
  const layout = pond.canvasLayout ?? { x: 0, y: 0, width: 140, height: 90, aerators: [] };
  const { x, y, width, height, aerators } = layout;
  const activeCycle = pond.cycles?.[0] ?? null;
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const progress = activeCycle?.targetWeightG && activeCycle?.initialWeightG
    ? Math.min(activeCycle.initialWeightG / activeCycle.targetWeightG, 1)
    : 0;

  const progressColor = progress >= 0.9 ? '#38bdf8' : progress >= 0.7 ? '#7dd3fc' : '#0ea5e9';

  const onPondMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onClick(pond.id);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: x, oy: y };

    const handleMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / scale;
      const dy = (ev.clientY - dragStart.current.my) / scale;
      onMove(pond.id, dragStart.current.ox + dx, dragStart.current.oy + dy);
    };

    const handleUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      void onDragEnd(pond.id);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pond.id, x, y, scale, onClick, onMove, onDragEnd]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const startMx = e.clientX;
    const startMy = e.clientY;
    const startW = width;
    const startH = height;

    const handleMove = (ev: MouseEvent) => {
      const newW = Math.max(80, startW + (ev.clientX - startMx) / scale);
      const newH = Math.max(60, startH + (ev.clientY - startMy) / scale);
      onResize(pond.id, newW, newH);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pond.id, width, height, scale, onResize]);

  const addAerator = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = Date.now();
    onAeratorsChange(pond.id, [...aerators, { id: newId, xPct: 0.5, yPct: 0.5 }]);
  }, [aerators, pond.id, onAeratorsChange]);

  const moveAerator = useCallback((id: number, xPct: number, yPct: number) => {
    onAeratorsChange(pond.id, aerators.map(a => a.id === id ? { ...a, xPct, yPct } : a));
  }, [aerators, pond.id, onAeratorsChange]);

  const removeAerator = useCallback((id: number) => {
    onAeratorsChange(pond.id, aerators.filter(a => a.id !== id));
  }, [aerators, pond.id, onAeratorsChange]);

  const bg = STATUS_BG[pond.status] ?? '#ffffff';
  const border = STATUS_BORDER[pond.status] ?? '#94a3b8';
  const fontSize = Math.max(9, 12 / scale);
  const badgeFontSize = Math.max(7, 10 / scale);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <rect
        width={width}
        height={height}
        rx={4}
        fill={bg}
        stroke={isSelected ? '#fff' : border}
        strokeWidth={isSelected ? 2 : 1.5}
        style={{ cursor: 'grab' }}
        onMouseDown={onPondMouseDown}
      />
      <text
        x={8}
        y={fontSize + 6}
        fill="#0f172a"
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {pond.code}
      </text>
      <text
        x={8}
        y={fontSize * 2 + 8}
        fill="#64748b"
        fontSize={fontSize * 0.85}
        fontFamily="monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {formatAreaHa(pond.areaHa)}ha
      </text>
      {activeCycle?.larvaeLotCode && (
        <>
          <rect
            x={width - badgeFontSize * 7}
            y={4}
            width={badgeFontSize * 6.5}
            height={badgeFontSize + 6}
            rx={3}
            fill="#dbeafe"
          />
          <text
            x={width - badgeFontSize * 3.8}
            y={badgeFontSize + 6}
            fill="#0284c7"
            fontSize={badgeFontSize}
            textAnchor="middle"
            fontFamily="monospace"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {activeCycle.larvaeLotCode}
          </text>
        </>
      )}
      {progress > 0 && (
        <>
          <rect x={0} y={height - 4} width={width} height={4} rx={2} fill="#e2e8f0" />
          <rect x={0} y={height - 4} width={width * progress} height={4} rx={2} fill={progressColor} />
        </>
      )}
      <g>
        {aerators.map(a => (
          <CanvasAerator
            key={a.id}
            aerator={a}
            pondWidth={width}
            pondHeight={height - 4}
            scale={scale}
            onMove={moveAerator}
            onRemove={removeAerator}
          />
        ))}
      </g>
      {isHovered && (
        <g
          transform={`translate(${width - 20}, ${height - 20})`}
          onClick={addAerator}
          style={{ cursor: 'pointer' }}
        >
          <circle r={8} fill="#0284c7" opacity={0.85} />
          <text textAnchor="middle" y={4} fill="white" fontSize={12} style={{ userSelect: 'none' }}>+</text>
        </g>
      )}
      {isSelected && (
        <rect
          x={width - 8}
          y={height - 8}
          width={8}
          height={8}
          fill={border}
          style={{ cursor: 'se-resize' }}
          onMouseDown={onResizeMouseDown}
        />
      )}
    </g>
  );
}
