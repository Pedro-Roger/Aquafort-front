import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import { usePonds, useUpdatePond } from '../hooks/usePonds';

export function AutoFeedersPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const updatePond = useUpdatePond();

  const [counts, setCounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Seed the inputs once the ponds arrive, without clobbering what is being
  // typed. Returning the same object when nothing is missing matters: the state
  // setter runs on every render, and a fresh object each time would loop.
  useEffect(() => {
    setCounts((current) => {
      const missing = ponds.filter((pond) => current[pond.id] === undefined);
      if (!missing.length) return current;

      const next = { ...current };
      missing.forEach((pond) => {
        next[pond.id] = String(pond.feederCount ?? 0);
      });
      return next;
    });
  }, [ponds]);

  async function save(pondId: string) {
    const value = Number(counts[pondId] ?? 0);
    if (!Number.isFinite(value) || value < 0) return;

    setSavingId(pondId);
    try {
      await updatePond.mutateAsync({ id: pondId, data: { feederCount: value } as never });
      // The confirmation clears when the field is edited again, so there is no
      // timer left running behind the screen.
      setSavedId(pondId);
    } finally {
      setSavingId(null);
    }
  }

  const total = ponds.reduce((sum, pond) => sum + (pond.feederCount ?? 0), 0);
  const withoutFeeder = ponds.filter((pond) => !pond.feederCount).length;

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={workspaceEyebrow}>Alimentadores</div>
        <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
          Quantos alimentadores estão instalados em cada viveiro.
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Total instalado</div>
            <div style={workspaceTileValue}>{isLoading ? '—' : total}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Viveiros</div>
            <div style={workspaceTileValue}>{ponds.length}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Sem alimentador</div>
            <div style={workspaceTileValue}>{withoutFeeder}</div>
          </div>
        </div>
      </div>

      <section style={workspaceCard}>
        <h2 style={sectionTitle}>Por viveiro</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: space.tile }}>
          {ponds.map((pond) => (
            <div key={pond.id} style={{ ...workspaceTile, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: space.inline }}>
                <div>
                  <div style={workspaceTileLabel}>Viveiro</div>
                  <div style={{ ...workspaceTileValue, fontSize: 17, marginTop: 4 }}>{pond.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pond.name}</div>
                </div>
                <span style={{ width: 30, height: 30, borderRadius: radius.control, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>
                  <Cpu size={15} />
                </span>
              </div>

              <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', marginTop: space.tile }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Alimentadores"
                    type="number"
                    min={0}
                    step="1"
                    value={counts[pond.id] ?? ''}
                    onChange={(e) => {
                      setSavedId((current) => (current === pond.id ? null : current));
                      setCounts((current) => ({ ...current, [pond.id]: e.target.value }));
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  loading={savingId === pond.id}
                  onClick={() => save(pond.id)}
                >
                  {savedId === pond.id ? 'Salvo' : 'Salvar'}
                </Button>
              </div>
            </div>
          ))}
          {!ponds.length && !isLoading && (
            <EmptyState
              compact
              title="Nenhum viveiro cadastrado."
              description="Cadastre um viveiro para definir quantos alimentadores ele tem."
            />
          )}
        </div>
      </section>
    </div>
  );
}
