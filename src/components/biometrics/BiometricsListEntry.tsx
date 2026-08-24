import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { radius, space } from '../ui/surfaces';
import { formatDateOnly } from '../../lib/format';

export interface BiometricsListRow {
  pondId: string;
  pondCode: string;
  /** Null when the pond has no active cycle — row renders but can't be saved. */
  cycleId: string | null;
  previousWeightG: number | null;
  previousDate: string | null;
}

interface BiometricsListEntryProps {
  rows: BiometricsListRow[];
  date: string;
  onDateChange: (date: string) => void;
  onSave: (cycleId: string, weightG: number) => Promise<unknown>;
}

function fmt(value: number, digits = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * Fluxo de lançamento em lote: um viveiro por linha, biometria anterior e
 * crescimento calculado ao lado, salvo independentemente por linha — a
 * fazenda raramente é medida inteira no mesmo dia, então cada viveiro
 * atualiza sua própria leitura sem depender dos outros.
 */
export function BiometricsListEntry({ rows, date, onDateChange, onSave }: BiometricsListEntryProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function handleSave(row: BiometricsListRow) {
    if (!row.cycleId) return;
    const raw = drafts[row.pondId];
    const weightG = Number(raw);
    if (!raw || !Number.isFinite(weightG) || weightG <= 0) return;

    setSavingId(row.pondId);
    setErrorId(null);
    try {
      await onSave(row.cycleId, weightG);
      setSavedId(row.pondId);
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.pondId];
        return next;
      });
      setTimeout(() => setSavedId((current) => (current === row.pondId ? null : current)), 2000);
    } catch {
      setErrorId(row.pondId);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ display: 'grid', gap: space.section }}>
      <div style={{ maxWidth: 220 }}>
        <Input
          label="Data da leitura"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState compact title="Nenhum viveiro ativo." description="Inicie um ciclo para lançar biometria." />
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1.4fr 1fr auto',
              gap: space.tile,
              padding: '0 14px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            <div>Viveiro</div>
            <div>Biometria anterior</div>
            <div>Nova biometria (g)</div>
            <div>Crescimento</div>
            <div />
          </div>

          {rows.map((row) => {
            const draft = drafts[row.pondId] ?? '';
            const draftWeight = Number(draft);
            const hasValidDraft = draft !== '' && Number.isFinite(draftWeight) && draftWeight > 0;
            const growth = hasValidDraft && row.previousWeightG != null ? draftWeight - row.previousWeightG : null;
            const isSaving = savingId === row.pondId;
            const isSaved = savedId === row.pondId;
            const hasError = errorId === row.pondId;

            return (
              <div
                key={row.pondId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.4fr 1fr auto',
                  gap: space.tile,
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: radius.tile,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.pondCode}</div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {row.previousWeightG != null ? (
                    <>
                      {fmt(row.previousWeightG)} g
                      {row.previousDate && (
                        <span style={{ color: 'var(--text-muted)' }}> · {formatDateOnly(row.previousDate)}</span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Sem leitura ainda</span>
                  )}
                </div>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={row.cycleId ? 'Peso em gramas' : 'Sem ciclo ativo'}
                  value={draft}
                  disabled={!row.cycleId}
                  onChange={(e) => setDrafts((current) => ({ ...current, [row.pondId]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(row);
                  }}
                  style={{
                    height: 36,
                    padding: '0 10px',
                    borderRadius: radius.control,
                    border: '1px solid var(--border)',
                    backgroundColor: row.cycleId ? 'var(--bg-input)' : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    width: '100%',
                  }}
                />

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: growth == null ? 'var(--text-muted)' : growth >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {growth == null ? '—' : `${growth >= 0 ? '+' : ''}${fmt(growth)} g`}
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(row)}
                  disabled={!row.cycleId || !hasValidDraft || isSaving}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: radius.control,
                    border: 'none',
                    backgroundColor: isSaved ? 'var(--success)' : 'var(--accent-fill)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: !row.cycleId || !hasValidDraft || isSaving ? 'not-allowed' : 'pointer',
                    opacity: !row.cycleId || !hasValidDraft || isSaving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isSaving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : isSaved ? <Check size={14} /> : null}
                  {isSaved ? 'Salvo' : 'Salvar'}
                </button>

                {hasError && (
                  <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 12 }}>
                    Não foi possível salvar essa leitura. Tente novamente.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
