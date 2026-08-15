import { useMemo, useState, type DragEvent } from 'react';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { useCycles } from '../hooks/useCycles';
import { usePonds, useUpdatePond } from '../hooks/usePonds';
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
import { PondStatus, PondType, type Pond } from '../types';

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

const DRAG_MIME = 'application/x-aquafort-pond-id';

export function TanquesPage() {
  const { data: ponds = [], isLoading } = usePonds();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: cycles = [] } = useCycles({ status: 'ativo' });
  const updatePond = useUpdatePond();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverType, setDragOverType] = useState<PondType | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

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

  function handleDragStart(pond: Pond) {
    return (event: DragEvent<HTMLDivElement>) => {
      // Only empty ponds move between categories — a pond mid-cycle keeps
      // the classification the animals were stocked under.
      if (pond.status !== PondStatus.VAZIO) {
        event.preventDefault();
        setFeedback({ text: `${pond.code} está ${pond.status.toLowerCase()} — esvazie o viveiro antes de reclassificar.`, tone: 'error' });
        return;
      }
      event.dataTransfer.setData(DRAG_MIME, pond.id);
      event.dataTransfer.effectAllowed = 'move';
      setDraggingId(pond.id);
    };
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverType(null);
  }

  function handleDragOver(type: PondType) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDragOverType(type);
    };
  }

  function handleDrop(type: PondType) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverType(null);
      setDraggingId(null);

      const pondId = event.dataTransfer.getData(DRAG_MIME);
      const pond = ponds.find((item) => item.id === pondId);
      if (!pond || pond.type === type) return;

      updatePond.mutate(
        { id: pond.id, data: { type } },
        {
          onSuccess: () => setFeedback({ text: `${pond.code} movido para ${longTypeLabel(type)}.`, tone: 'ok' }),
          onError: () => setFeedback({ text: `Não foi possível mover ${pond.code}.`, tone: 'error' }),
        },
      );
    };
  }

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
              <span style={sectionSubtitle}>Arraste um viveiro vazio para outra categoria, ou use o povoamento para distribuir um lote.</span>
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

        {feedback ? (
          <div
            style={{
              marginTop: space.inline,
              fontSize: 13,
              color: feedback.tone === 'ok' ? 'var(--accent-dark)' : 'var(--danger, #dc2626)',
            }}
          >
            {feedback.text}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: space.page }}>
        {categories.map((category) => {
          const isDropTarget = dragOverType === category.type;
          return (
            <section
              key={category.type}
              style={{
                ...workspaceCard,
                outline: isDropTarget ? '2px dashed var(--accent-dark)' : '2px dashed transparent',
                outlineOffset: 4,
                transition: 'outline-color 0.12s',
              }}
              onDragOver={handleDragOver(category.type)}
              onDragLeave={() => setDragOverType((current) => (current === category.type ? null : current))}
              onDrop={handleDrop(category.type)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={workspaceTileLabel}>{category.label}</div>
                  <h2 style={{ ...sectionTitle, marginTop: 4 }}>{category.title}</h2>
                </div>
                <div style={sectionSubtitle}>{category.items.length}  viveiros · {category.active} povoados</div>
              </div>

              {category.items.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: space.tile }}>
                  {category.items.map((pond) => {
                    const isEmpty = pond.status === PondStatus.VAZIO;
                    return (
                      <div
                        key={pond.id}
                        draggable={isEmpty}
                        onDragStart={handleDragStart(pond)}
                        onDragEnd={handleDragEnd}
                        title={isEmpty ? 'Arraste para outra categoria' : 'Só viveiros vazios podem ser reclassificados'}
                        style={{
                          ...workspaceTile,
                          padding: 14,
                          borderRadius: radius.tile,
                          cursor: isEmpty ? 'grab' : 'default',
                          opacity: draggingId === pond.id ? 0.4 : 1,
                          transition: 'opacity 0.12s',
                        }}
                      >
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
                    );
                  })}
                </div>
              ) : (
                <EmptyState compact title={isDropTarget ? 'Solte aqui para mover para esta categoria.' : 'Sem viveiros cadastrados nessa categoria.'} />
              )}
            </section>
          );
        })}
      </div>
      <PondFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
