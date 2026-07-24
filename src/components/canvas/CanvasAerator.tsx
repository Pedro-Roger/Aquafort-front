import { useCallback, useRef, useState } from 'react';
import type { Aerator } from '../../types';

interface Props {
  aerator: Aerator;
  pondWidth: number;
  pondHeight: number;
  scale: number;
  onMove: (id: number, xPct: number, yPct: number) => void;
  onRemove: (id: number) => void;
}

export function CanvasAerator({ aerator, pondWidth, pondHeight, scale, onMove, onRemove }: Props) {
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

  const x = aerator.xPct * pondWidth;
  const y = aerator.yPct * pondHeight;
  const r = Math.max(8, 10 / scale);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: x, oy: y };
    setDragging(true);

    const handleMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / scale;
      const dy = (ev.clientY - dragStart.current.my) / scale;
      const nx = Math.min(Math.max(dragStart.current.ox + dx, r), pondWidth - r);
      const ny = Math.min(Math.max(dragStart.current.oy + dy, r), pondHeight - r);
      onMove(aerator.id, nx / pondWidth, ny / pondHeight);
    };

    const handleUp = () => {
      dragStart.current = null;
      setDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [aerator.id, x, y, pondWidth, pondHeight, scale, onMove, r]);

  return (
    <g
      onMouseDown={onMouseDown}
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      <circle cx={x} cy={y} r={r} fill="#0284c7" opacity={0.9} />
      <text
        x={x} y={y + r * 0.38}
        textAnchor="middle"
        fill="white"
        fontSize={r * 1.2}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        ⊕
      </text>
      {showRemove && (
        <circle
          cx={x + r * 0.7}
          cy={y - r * 0.7}
          r={r * 0.55}
          fill="#1d4ed8"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onRemove(aerator.id); }}
        />
      )}
      {showRemove && (
        <text
          x={x + r * 0.7}
          y={y - r * 0.7 + r * 0.2}
          textAnchor="middle"
          fill="white"
          fontSize={r * 0.8}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          ×
        </text>
      )}
    </g>
  );
}
