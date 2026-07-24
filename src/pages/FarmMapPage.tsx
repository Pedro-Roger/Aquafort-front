import { useMemo, useRef, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  buildTankGroups,
  DEFAULT_TANK_CONFIGS,
  getTankVisualProfile,
  type TankGroupConfig,
} from './farmMap';

function asNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function groupPalette(kind: TankGroupConfig['kind']) {
  if (kind === 'PRE_BERCARIO') {
    return {
      border: 'rgba(148, 163, 184, 0.22)',
      fill: 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(51, 65, 85, 0.72))',
      glow: 'rgba(15, 23, 42, 0.08)',
    };
  }
  if (kind === 'BERCARIO') {
    return {
      border: 'rgba(148, 163, 184, 0.22)',
      fill: 'linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(71, 85, 105, 0.68))',
      glow: 'rgba(15, 23, 42, 0.08)',
    };
  }
  return {
    border: 'rgba(148, 163, 184, 0.22)',
    fill: 'linear-gradient(180deg, rgba(37, 99, 235, 0.82), rgba(71, 85, 105, 0.68))',
    glow: 'rgba(15, 23, 42, 0.08)',
  };
}

export function FarmMapPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(() =>
    DEFAULT_TANK_CONFIGS.map((config) => ({ ...config, count: String(config.count) })),
  );
  const [configs, setConfigs] = useState(DEFAULT_TANK_CONFIGS);

  const groups = useMemo(() => buildTankGroups(configs), [configs]);
  const totals = useMemo(() => {
    const total = groups.reduce((sum, group) => sum + group.tanks.length, 0);
    const largest = groups.reduce((max, group) => Math.max(max, group.tanks.length), 0);
    return { total, largest, groups: groups.length };
  }, [groups]);

  const handleGenerate = () => {
    setConfigs(
      draft.map((item) => ({
        kind: item.kind,
        label: item.label,
        shortLabel: item.shortLabel,
        count: Math.max(0, Math.floor(asNumber(item.count, 0))),
      })),
    );
  };

  const handleReset = () => {
    setDraft(DEFAULT_TANK_CONFIGS.map((config) => ({ ...config, count: String(config.count) })));
    setConfigs(DEFAULT_TANK_CONFIGS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0, height: '100%' }}>
      <div
        style={{
          borderRadius: 30,
          padding: 20,
          color: 'var(--text-primary)',
          background: 'var(--bg-card)',
          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <Sparkles size={14} />
              Tanques
            </div>
            <h1 style={{ margin: '10px 0 0', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.05em', color: 'var(--text-primary)' }}>
              BRÇ, PC e VE.
            </h1>
          </div>
          <InfoBadge label={`${totals.total} tanques`} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: 16, minHeight: 0, flex: 1 }}>
        <section
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 18,
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 0,
          }}
        >
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 17 }}>Quantidade por grupo</div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {draft.map((item, index) => (
              <div key={item.kind} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 14, backgroundColor: 'var(--bg-elevated)' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 10 }}>{item.label}</div>
                <Input
                  label="Quantidade"
                  type="number"
                  min={0}
                  step="1"
                  value={item.count}
                  onChange={(e) => {
                    const next = [...draft];
                    next[index] = { ...item, count: e.target.value };
                    setDraft(next);
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
            <Button icon={<RefreshCw size={16} />} variant="secondary" onClick={handleReset}>
              Resetar
            </Button>
            <Button icon={<Sparkles size={16} />} onClick={handleGenerate}>
              Gerar grupos
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {groups.map((group) => (
              <div key={group.kind} style={{ borderRadius: 16, padding: 12, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.shortLabel}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginTop: 6 }}>{group.tanks.length}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          ref={boardRef}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 28,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            boxShadow: '0 16px 34px rgba(15, 23, 42, 0.05)',
            minHeight: 640,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', padding: 22, display: 'grid', gap: 18 }}>
            {groups.map((group) => {
              const palette = groupPalette(group.kind);

              return (
                <div
                  key={group.kind}
                  style={{
                    borderRadius: 22,
                    padding: 16,
                    background: 'rgba(255,255,255,0.92)',
                    border: `1px solid ${palette.border}`,
                    boxShadow: `0 14px 30px ${palette.glow}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.shortLabel}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginTop: 4 }}>{group.label}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
                    {group.tanks.map((tank) => {
                      const tankProfile = getTankVisualProfile(group.kind);
                      const tankPalette = groupPalette(group.kind);
                      const isWide = tankProfile.width >= 180;
                      return (
                        <div
                          key={tank.id}
                          style={{
                            position: 'relative',
                            width: tankProfile.width,
                            height: tankProfile.height,
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: tankPalette.fill,
                            boxShadow: `0 8px 18px ${tankPalette.glow}`,
                            color: '#f8fafc',
                            cursor: 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: 12,
                          }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                              <div>
                                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.72 }}>{group.shortLabel}</div>
                                <div style={{ marginTop: 4, fontSize: isWide ? 18 : 16, fontWeight: 800 }}>{tank.code}</div>
                              </div>
                              <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.78)' }} />
                            </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 10 }}>
                            <div style={{ fontSize: 12, opacity: 0.88 }}>{tank.label}</div>
                            <div style={{ fontSize: isWide ? 26 : 22, lineHeight: 1, fontWeight: 900, opacity: 0.9 }}>{tank.index}</div>
                          </div>

                          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>
                            <div style={{ width: `${Math.min(100, 18 + tank.index * 7)}%`, height: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.76)' }} />
                          </div>
                        </div>
                      );
                    })}
                    {!group.tanks.length && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 4px' }}>
                        Nenhum tanque gerado nesse grupo.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 999,
        color: 'var(--text-secondary)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        boxShadow: '0 6px 14px rgba(15, 23, 42, 0.04)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
