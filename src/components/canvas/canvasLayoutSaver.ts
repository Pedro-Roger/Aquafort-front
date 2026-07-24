import type { CanvasLayout } from '../../types';

export interface CanvasLayoutSaveRequest {
  pondId: string;
  layout: Partial<CanvasLayout>;
}

export interface TimerApi {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
}

export interface CanvasLayoutSaverOptions {
  delayMs?: number;
  timerApi?: TimerApi;
}

interface PendingLayout {
  pondId: string;
  layout: Partial<CanvasLayout>;
}

export function createCanvasLayoutSaver(
  save: (request: CanvasLayoutSaveRequest) => Promise<void>,
  options: CanvasLayoutSaverOptions = {},
) {
  const delayMs = options.delayMs ?? 800;
  const timerApi = options.timerApi ?? globalThis;
  const pendingLayouts = new Map<string, Partial<CanvasLayout>>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const clearTimer = (pondId: string) => {
    const timer = timers.get(pondId);
    if (!timer) return;
    timerApi.clearTimeout(timer);
    timers.delete(pondId);
  };

  const commit = async ({ pondId, layout }: PendingLayout) => {
    pendingLayouts.delete(pondId);
    clearTimer(pondId);
    await save({ pondId, layout });
  };

  const schedule = (pondId: string, layoutPatch: Partial<CanvasLayout>) => {
    const existing = pendingLayouts.get(pondId) ?? {};
    pendingLayouts.set(pondId, { ...existing, ...layoutPatch });
    clearTimer(pondId);
    const timer = timerApi.setTimeout(() => {
      const layout = pendingLayouts.get(pondId);
      if (!layout) return;
      void commit({ pondId, layout });
    }, delayMs);
    timers.set(pondId, timer);
  };

  const flush = async (pondId: string) => {
    const layout = pendingLayouts.get(pondId);
    if (!layout) return;
    await commit({ pondId, layout });
  };

  const cancel = (pondId?: string) => {
    if (pondId) {
      pendingLayouts.delete(pondId);
      clearTimer(pondId);
      return;
    }

    for (const id of pendingLayouts.keys()) {
      clearTimer(id);
    }
    pendingLayouts.clear();
  };

  return { schedule, flush, cancel };
}
