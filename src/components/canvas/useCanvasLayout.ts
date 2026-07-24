import { useCallback, useEffect, useRef, useState } from 'react';
import { createCanvasLayoutSaver } from './canvasLayoutSaver';
import { useUpdateCanvasLayout } from '../../hooks/usePonds';
import type { Aerator, CanvasLayout } from '../../types';

export function useCanvasLayout() {
  const updateMutation = useUpdateCanvasLayout();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saverRef = useRef<ReturnType<typeof createCanvasLayoutSaver> | null>(null);

  const handlePersist = useCallback(async ({ pondId, layout }: { pondId: string; layout: Partial<CanvasLayout> }) => {
    setSaveStatus('saving');
    try {
      await updateMutation.mutateAsync({ pondId, layout });
      setSaveStatus('saved');
      if (saveIdleTimeoutRef.current) clearTimeout(saveIdleTimeoutRef.current);
      saveIdleTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
    }
  }, [updateMutation]);

  if (!saverRef.current) {
    saverRef.current = createCanvasLayoutSaver(handlePersist);
  }

  useEffect(() => () => {
    saverRef.current?.cancel();
    if (saveIdleTimeoutRef.current) clearTimeout(saveIdleTimeoutRef.current);
  }, []);

  const savePosition = useCallback((pondId: string, x: number, y: number) => {
    setSaveStatus('saving');
    saverRef.current?.schedule(pondId, { x, y });
  }, []);

  const saveSize = useCallback((pondId: string, width: number, height: number) => {
    setSaveStatus('saving');
    saverRef.current?.schedule(pondId, { width, height });
  }, []);

  const saveAerators = useCallback((pondId: string, aerators: Aerator[]) => {
    setSaveStatus('saving');
    saverRef.current?.schedule(pondId, { aerators });
  }, []);

  const flushPondLayout = useCallback(async (pondId: string) => {
    await saverRef.current?.flush(pondId);
  }, []);

  return { savePosition, saveSize, saveAerators, flushPondLayout, saveStatus };
}
