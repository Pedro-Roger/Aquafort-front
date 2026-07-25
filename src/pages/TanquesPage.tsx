import { useMemo } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useCycles } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
import { workspaceEyebrow, workspaceSurface, workspaceTile, workspaceTileLabel, workspaceTileValue } from '../components/ui/surfaces';
import { PondStatus, PondType } from '../types';

function fmt(value: number, digits = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function typeLabel(type: PondType) {
  if (type === PondType.PRE_BERCARIO) return 'BRÇ';
  if (type === PondType.BERCARIO) return 'PC';
  return 'VE';
}

function longTypeLabel(type: PondType) {
  if (type === PondType.PRE_BERCARIO) return 'Berçário';
  if (type === PondType.BERCARIO) return 'Pré-cria';
  return 'Viveiro de engorda';
}

export function TanquesPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const { data: cycles = [] } = useCycles({ status: 'ativo' });

  const categories = useMemo(() => {
    return [PondType.PRE_BERCARIO, PondType.BERCARIO, PondType.ENGORDA].map((type) => {
      const items = ponds.filter((pond) => pond.type === type);
      return {
        type,
        label: typeLabel(type),
        title: longTypeLabel(type),
        items,
        active: items.filter((pond) => pond.status === PondStatus.POVOADO || pond.status === PondStatus.DESPESCANDO).length,
      };
    });
  }, [ponds]);

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Carregando tanques...</div>;
  }

  const stats = [
    { label: 'Tanques totais', value: ponds.length },
    { label: 'Povoados', value: ponds.filter((pond) => pond.status === PondStatus.POVOADO).length },
    { label: 'Preparando', value: ponds.filter((pond) => pond.status === PondStatus.PREPARANDO).length },
    { label: 'Lotes ativos', value: cycles.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          ...workspaceSurface,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Tanques</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
            <ArrowRightLeft size={18} />
            <span style={{ fontSize: 13 }}>Use o povoamento para distribuir o mesmo lote entre vários tanques.</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          {stats.map((item) => (
            <div key={item.label} style={workspaceTile}>
              <div style={workspaceTileLabel}>{item.label}</div>
              <div style={{ ...workspaceTileValue, fontSize: 24 }}>{fmt(item.value, 0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {categories.map((category) => (
          <section key={category.type} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{category.label}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{category.title}</div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{category.items.length} tanques · {category.active} povoados</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {category.items.map((pond) => (
                <div key={pond.id} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14, backgroundColor: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pond.code}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{pond.name}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12 }}>
                      <div>{pond.status}</div>
                      <div>{pond.areaHa} ha</div>
                    </div>
                  </div>
                </div>
              ))}
              {!category.items.length && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem tanques cadastrados nessa categoria.</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
