import { describe, expect, it } from 'vitest';
import { createCanvasLayoutSaver } from './canvasLayoutSaver';

describe('createCanvasLayoutSaver', () => {
  it('flush saves the latest pending layout immediately', async () => {
    const calls: Array<{ pondId: string; layout: Record<string, unknown> }> = [];

    const saver = createCanvasLayoutSaver(async request => {
      calls.push(request);
    }, {
      delayMs: 1000,
      timerApi: {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      },
    });

    saver.schedule('pond-1', { x: 10, y: 20 });
    saver.schedule('pond-1', { x: 30, y: 40 });
    await saver.flush('pond-1');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      pondId: 'pond-1',
      layout: { x: 30, y: 40 },
    });
  });

  it('keeps pending layouts isolated per pond', async () => {
    const calls: Array<{ pondId: string; layout: Record<string, unknown> }> = [];

    const saver = createCanvasLayoutSaver(async request => {
      calls.push(request);
    });

    saver.schedule('pond-1', { x: 10, y: 20 });
    saver.schedule('pond-2', { x: 90, y: 100 });

    await saver.flush('pond-1');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      pondId: 'pond-1',
      layout: { x: 10, y: 20 },
    });

    await saver.flush('pond-2');

    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual({
      pondId: 'pond-2',
      layout: { x: 90, y: 100 },
    });
  });
});
