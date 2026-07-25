import { useMemo, useState } from 'react';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { useCycles } from '../hooks/useCycles';
import { usePonds } from '../hooks/usePonds';
import { Button } from '../components/ui/Button';
import { PondFormModal } from '../components/ponds/PondFormModal';
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
  const [createOpen, setCreateOpen] = useState(false);
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
    return <div style={{ color: 'var(--text-muted)' }}>Carregando viveiros...</div>;
  }

  const stats = [
    { label: 'Viveiros totais', value: ponds.length },
    { label: 'Povoados', value: ponds.filter((pond) => pond.status === PondStatus.POVOADO).length },
    { label: 'Preparando', value: ponds.filter((pond) => pond.status === PondStatus.PREPARANDO).length },
    { label: 'Lotes ativos', value: cycles.length },
  ];

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Viveiros</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.section, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.inline, color: 'var(--text-secondary)' }}>
              <ArrowRightLeft size={16} />
              <span style={sectionSubtitle}>Use o povoamento para distribuir o mesmo lote entre vários viveiros.</span>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Cadastrar viveiro
            </Button>
          </div>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          {stats.map((item) => (
            <div key={item.label} style={workspaceTile}>
              <div style={workspaceTileLabel}>{item.label}</div>
              <div style={workspaceTileValue}>{fmt(item.value, 0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: space.page }}>
        {categories.map((category) => (
          <section key={category.type} style={workspaceCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={workspaceTileLabel}>{category.label}</div>
                <h2 style={{ ...sectionTitle, marginTop: 4 }}>{category.title}</h2>
              </div>
              <div style={sectionSubtitle}>{category.items.length}  viveiros · {category.active} povoados</div>
            </div>

            {category.items.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: space.tile }}>
                {category.items.map((pond) => (
                  <div key={pond.id} style={{ ...workspaceTile, padding: 14, borderRadius: radius.tile }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile }}>
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
              </div>
            ) : (
              <EmptyState compact title="Sem viveiros cadastrados nessa categoria." />
            )}
          </section>
        ))}
      </div>
      <PondFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
