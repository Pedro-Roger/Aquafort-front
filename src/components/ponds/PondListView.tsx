import { useState } from 'react';
import { PondTable } from './PondTable';
import { PondCard } from './PondCard';
import { usePonds, usePondCanvas } from '../../hooks/usePonds';
import { useCycles } from '../../hooks/useCycles';
import { useFeedingTable } from '../../hooks/useFeeding';
import { STATUS_META } from './pondInsights';
import type { Pond, PondStatus } from '../../types';

interface Props {
  onOpenCanvas?: (pondId: string) => void;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function PondListView({ onOpenCanvas }: Props) {
  const [mode, setMode] = useState<'table' | 'cards'>('cards');
  const { data = [], isLoading } = usePonds();
  const { data: pondCanvas = [] } = usePondCanvas();
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const { data: feedingTable } = useFeedingTable({ date: todayIsoDate() });
  const ponds: Pond[] = (data as any)?.data ?? (data as any)?.ponds ?? data ?? [];

  const activeRows = feedingTable?.rows ?? [];
  const cards = ponds.map((pond) => {
    const canvasPond = pondCanvas.find((item) => item.id === pond.id);
    const cycle = cycles.find((item) => item.pondId === pond.id);
    const feed = activeRows.find((item) => item.pondId === pond.id);
    const activeCanvasCycle = canvasPond?.cycles?.[0];

    return {
      pond,
      summary: {
        cultivationDays: cycle?.cultivationDays ?? null,
        feedTodayKg: feed?.dailyFeedKg ?? null,
        feedAccumulatedKg: feed?.racaoAcumuladaKg ?? null,
        avgWeightG: cycle?.avgWeightG ?? null,
        plCount: activeCanvasCycle?.plCount ?? null,
        density: activeCanvasCycle?.density ?? null,
        lotLabel: cycle?.lotCode ?? activeCanvasCycle?.larvaeLotCode ?? activeCanvasCycle?.larvaeSupplier ?? null,
      },
    };
  });

  const overview = [
    {
      label: 'Tanques ativos',
      value: ponds.filter((pond) => pond.status === 'POVOADO' || pond.status === 'DESPESCANDO').length,
      tone: '#0284c7',
    },
    {
      label: 'Area total',
      value: `${fmt(ponds.reduce((sum, pond) => sum + Number(pond.areaHa ?? 0), 0), 2)} ha`,
      tone: '#38bdf8',
    },
    {
      label: 'Racao hoje',
      value: `${fmt(activeRows.reduce((sum, row) => sum + row.dailyFeedKg, 0), 1)} kg`,
      tone: '#0ea5e9',
    },
    {
      label: 'Janela critica',
      value: `${ponds.filter((pond) => pond.status === 'PREPARANDO' || pond.status === 'DESPESCANDO').length} tanques`,
      tone: '#7dd3fc',
    },
  ];

  const statusFilters: Array<{ status: PondStatus; label: string }> = [
    { status: 'POVOADO', label: 'Povoados' },
    { status: 'PREPARANDO', label: 'Preparando' },
    { status: 'VAZIO', label: 'Vazios' },
  ];

  const toggleBtn = (value: 'table' | 'cards', label: string) => (
    <button
      key={value}
      onClick={() => setMode(value)}
      style={{
        padding: '8px 12px',
        borderRadius: 12,
        cursor: 'pointer',
        background: mode === value ? 'linear-gradient(135deg, #0f172a, #0284c7)' : 'rgba(255,255,255,0.88)',
        border: `1px solid ${mode === value ? 'rgba(2, 132, 199, 0.4)' : 'var(--border)'}`,
        color: mode === value ? '#fff' : 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );

  if (isLoading) return <div style={{ color: 'var(--text-muted)', padding: 32 }}>Carregando viveiros...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          borderRadius: 26,
          padding: 20,
          border: '1px solid rgba(148, 163, 184, 0.18)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 132, 199, 0.94))',
          color: '#f8fafc',
          boxShadow: '0 26px 70px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.72, paddingTop: 8 }}>
            Operacao de tanques
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {toggleBtn('cards', 'Cards')}
            {toggleBtn('table', 'Tabela')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {overview.map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 18,
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(248,250,252,0.68)' }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: '#fff' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {statusFilters.map(({ status, label }) => {
          const meta = STATUS_META[status];
          const count = ponds.filter((pond) => pond.status === status).length;
          return (
            <div
              key={status}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 999,
                backgroundColor: '#fff',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: meta.accent }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
              <strong style={{ color: 'var(--text-primary)' }}>{count}</strong>
            </div>
          );
        })}
      </div>

      {mode === 'table' ? (
        <PondTable ponds={ponds} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {cards.map(({ pond, summary }) => (
            <PondCard key={pond.id} pond={pond} summary={summary} onOpenCanvas={onOpenCanvas} />
          ))}
        </div>
      )}
    </div>
  );
}
