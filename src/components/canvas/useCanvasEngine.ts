import { useState, useCallback, useRef } from 'react';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function useCanvasEngine() {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);

  const onBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
    setIsDraggingCanvas(true);
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current || !isDraggingCanvas) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setTransform(t => ({ ...t, x: dragStart.current!.tx + dx, y: dragStart.current!.ty + dy }));
  }, [isDraggingCanvas]);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
    setIsDraggingCanvas(false);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTransform(t => {
      const newScale = Math.min(Math.max(t.scale * delta, 0.2), 4);
      const wx = (cx - t.x) / t.scale;
      const wy = (cy - t.y) / t.scale;
      return {
        scale: newScale,
        x: cx - wx * newScale,
        y: cy - wy * newScale,
      };
    });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.2, 4) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(t => ({ ...t, scale: Math.max(t.scale * 0.8, 0.2) }));
  }, []);

  const fitAll = useCallback((ponds: Array<{ x: number; y: number; width: number; height: number }>, containerW: number, containerH: number) => {
    if (!ponds.length) return;
    const minX = Math.min(...ponds.map(p => p.x));
    const minY = Math.min(...ponds.map(p => p.y));
    const maxX = Math.max(...ponds.map(p => p.x + p.width));
    const maxY = Math.max(...ponds.map(p => p.y + p.height));
    const pw = maxX - minX + 80;
    const ph = maxY - minY + 80;
    const fittedScale = Math.min(containerW / pw, containerH / ph, 1);
    const scale = Math.max(fittedScale, 0.45);
    setTransform({
      scale,
      x: (containerW - pw * scale) / 2 - minX * scale + 40 * scale,
      y: (containerH - ph * scale) / 2 - minY * scale + 40 * scale,
    });
  }, []);

  const selectPond = useCallback((id: string | null) => {
    setSelectedPondId(id);
  }, []);

  return {
    transform,
    selectedPondId,
    isDraggingCanvas,
    onBackgroundMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    zoomIn,
    zoomOut,
    fitAll,
    selectPond,
  };
}
