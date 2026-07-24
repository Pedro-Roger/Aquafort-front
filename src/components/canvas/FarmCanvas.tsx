import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasEngine } from './useCanvasEngine';
import { useCanvasLayout } from './useCanvasLayout';
import { CanvasPond } from './CanvasPond';
import { usePondCanvas } from '../../hooks/usePonds';
import type { Aerator, PondWithCanvas } from '../../types';

interface Props {
  onPondSelect: (pond: PondWithCanvas | null) => void;
  selectedPondId: string | null;
}

export function FarmCanvas({ onPondSelect, selectedPondId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: ponds = [], isLoading } = usePondCanvas();
  const { savePosition, saveSize, saveAerators, flushPondLayout, saveStatus } = useCanvasLayout();
  const engine = useCanvasEngine();
  const [showGrid, setShowGrid] = useState(true);
  const [localLayouts, setLocalLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number; aerators: Aerator[] }>>({});
  const didFit = useRef(false);
  const initializedPonds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const layouts: typeof localLayouts = {};
    ponds.forEach(p => {
      if (p.canvasLayout) {
        layouts[p.id] = {
          x: p.canvasLayout.x,
          y: p.canvasLayout.y,
          width: p.canvasLayout.width,
          height: p.canvasLayout.height,
          aerators: p.canvasLayout.aerators,
        };
      } else if (!initializedPonds.current.has(p.id)) {
        const idx = ponds.indexOf(p);
        layouts[p.id] = {
          x: 40 + (idx % 5) * 160,
          y: 40 + Math.floor(idx / 5) * 120,
          width: 140,
          height: 90,
          aerators: [],
        };
      }
      initializedPonds.current.add(p.id);
    });
    if (Object.keys(layouts).length) {
      setLocalLayouts(prev => ({ ...prev, ...layouts }));
    }
  }, [ponds]);

  useEffect(() => {
    if (!didFit.current && ponds.length && containerRef.current && Object.keys(localLayouts).length) {
      const rect = containerRef.current.getBoundingClientRect();
      const layouts = ponds.map(p => localLayouts[p.id] ?? { x: 0, y: 0, width: 140, height: 90 });
      engine.fitAll(layouts, rect.width, rect.height);
      didFit.current = true;
    }
  }, [ponds, localLayouts, engine]);

  const handleMove = useCallback((pondId: string, x: number, y: number) => {
    setLocalLayouts(prev => ({ ...prev, [pondId]: { ...prev[pondId], x, y } }));
    savePosition(pondId, x, y);
  }, [savePosition]);

  const handleResize = useCallback((pondId: string, width: number, height: number) => {
    setLocalLayouts(prev => ({ ...prev, [pondId]: { ...prev[pondId], width, height } }));
    saveSize(pondId, width, height);
  }, [saveSize]);

  const handleAeratorsChange = useCallback((pondId: string, aerators: Aerator[]) => {
    setLocalLayouts(prev => ({ ...prev, [pondId]: { ...prev[pondId], aerators } }));
    saveAerators(pondId, aerators);
  }, [saveAerators]);

  const handlePondClick = useCallback((pondId: string) => {
    engine.selectPond(pondId);
    const pond = ponds.find(p => p.id === pondId);
    onPondSelect(pond ?? null);
  }, [ponds, engine, onPondSelect]);

  const handleFitAll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const layouts = ponds.map(p => localLayouts[p.id] ?? { x: 0, y: 0, width: 140, height: 90 });
    engine.fitAll(layouts, rect.width, rect.height);
  }, [ponds, localLayouts, engine]);

  const pondsWithLayout: PondWithCanvas[] = ponds.map(p => ({
    ...p,
    canvasLayout: localLayouts[p.id]
      ? { id: p.canvasLayout?.id ?? '', pondId: p.id, updatedAt: p.canvasLayout?.updatedAt ?? '', ...localLayouts[p.id] }
      : p.canvasLayout,
  }));

  const GRID_SIZE = 40;
  const btnStyle = (active?: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 6,
    backgroundColor: active ? 'var(--accent)' : 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: active ? '#fff' : 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14,
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 560,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f8fbff 0%, #eef6fb 100%)',
        borderRadius: 18,
        border: '1px solid var(--border)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
      }}
      onWheel={engine.onWheel}
      onMouseMove={engine.onMouseMove}
      onMouseUp={engine.onMouseUp}
      onMouseLeave={engine.onMouseUp}
    >
      {showGrid && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern
              id="grid"
              width={GRID_SIZE * engine.transform.scale}
              height={GRID_SIZE * engine.transform.scale}
              x={engine.transform.x % (GRID_SIZE * engine.transform.scale)}
              y={engine.transform.y % (GRID_SIZE * engine.transform.scale)}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_SIZE * engine.transform.scale} 0 L 0 0 0 ${GRID_SIZE * engine.transform.scale}`}
                fill="none"
                stroke="rgba(100, 116, 139, 0.18)"
                strokeWidth={0.5}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: engine.isDraggingCanvas ? 'grabbing' : 'default' }}
        onMouseDown={engine.onBackgroundMouseDown}
      >
        <g transform={`translate(${engine.transform.x}, ${engine.transform.y}) scale(${engine.transform.scale})`}>
          {pondsWithLayout.map(pond => (
            pond.canvasLayout && (
              <CanvasPond
                key={pond.id}
                pond={pond}
                scale={engine.transform.scale}
                isSelected={selectedPondId === pond.id}
                onClick={handlePondClick}
                onMove={handleMove}
                onResize={handleResize}
                onAeratorsChange={handleAeratorsChange}
                onDragEnd={flushPondLayout}
              />
            )
          ))}
        </g>
      </svg>

      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>
          Carregando canvas...
        </div>
      )}

      {!isLoading && !pondsWithLayout.length && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)',
            fontSize: 15,
          }}
        >
          Nenhum viveiro disponivel para exibir no canvas.
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 14,
          border: '1px solid rgba(148, 163, 184, 0.22)',
          backgroundColor: 'rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>Canvas operacional</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {pondsWithLayout.length} viveiros
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          zoom {Math.round(engine.transform.scale * 100)}%
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={btnStyle()} onClick={engine.zoomIn} title="Zoom in">+</button>
        <button style={btnStyle()} onClick={engine.zoomOut} title="Zoom out">−</button>
        <button style={btnStyle()} onClick={handleFitAll} title="Fit all">⊡</button>
        <button style={btnStyle(showGrid)} onClick={() => setShowGrid(g => !g)} title="Toggle grid">⊞</button>
      </div>

      {saveStatus !== 'idle' && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'var(--text-muted)', fontSize: 12 }}>
          {saveStatus === 'saving' ? 'Salvando...' : '✓ Salvo'}
        </div>
      )}
    </div>
  );
}
