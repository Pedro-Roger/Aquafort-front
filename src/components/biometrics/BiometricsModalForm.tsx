import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { radius } from '../ui/surfaces';
import { averageWeightGToPlPerGram, plPerGramToAverageWeightG } from '../../lib/plPerGram';

/** RF-10 (revisado 2026-08-17): which unit the operator is currently typing into — never both at once (RN-12). */
type BercarioEntryUnit = 'pl_per_gram' | 'grams';

interface BiometricsModalFormProps {
  open: boolean;
  onClose: () => void;
  pondCode: string;
  loading?: boolean;
  /** RF-10/RN-10: the pond clicked into this modal is bercario — same field swap as the sidebar form. */
  isBercario?: boolean;
  /** Set when the clicked pond has no active cycle to save into — blocks the submit instead of silently writing to the wrong cycle. */
  disabledReason?: string | null;
  onSubmit: (data: {
    measuredAt: string;
    sampleCount: number;
    averageWeightG: number;
    survivalRatePct?: number;
    estimatedBiomass?: number;
  }) => void;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Keeps switch-triggered conversions readable (no float noise like 0.0040000000000001) without losing PL/g-relevant precision (RN-11). */
function formatConvertedValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Number(value.toFixed(6)));
}

export function BiometricsModalForm({
  open,
  onClose,
  pondCode,
  loading = false,
  isBercario = false,
  disabledReason = null,
  onSubmit,
}: BiometricsModalFormProps) {
  const [form, setForm] = React.useState({
    measuredAt: todayIsoDate(),
    sampleCount: '',
    weightInput: '',
    survivalRatePct: '',
    estimatedBiomass: '',
  });
  // RF-10 (revisado): bercario cycles open with PL/g pre-selected (field
  // reading, the most frequent case); the operator can switch to a direct
  // average weight for office launches from an already-weighed sample.
  const [entryUnit, setEntryUnit] = React.useState<BercarioEntryUnit>(
    isBercario ? 'pl_per_gram' : 'grams',
  );

  function handleUnitChange(nextUnit: BercarioEntryUnit) {
    if (nextUnit === entryUnit) return;
    setForm((current) => {
      const rawValue = Number(current.weightInput);
      if (!current.weightInput || !Number.isFinite(rawValue) || rawValue <= 0) {
        return { ...current, weightInput: '' };
      }
      // RN-09: exact inverses — convert what was typed instead of leaving
      // the previous unit's value sitting under the new label (silent bad data).
      const converted = nextUnit === 'grams'
        ? plPerGramToAverageWeightG(rawValue)
        : averageWeightGToPlPerGram(rawValue);
      return { ...current, weightInput: formatConvertedValue(converted) };
    });
    setEntryUnit(nextUnit);
  }

  const handleSave = () => {
    if (!form.measuredAt || !form.sampleCount || !form.weightInput) return;
    const rawValue = Number(form.weightInput);
    // RF-11/RF-15: avg_weight_g is always the persisted source of truth —
    // PL/g goes through the RN-09 formula, direct grams are stored as typed.
    const averageWeightG = entryUnit === 'pl_per_gram'
      ? plPerGramToAverageWeightG(rawValue)
      : rawValue;

    onSubmit({
      measuredAt: form.measuredAt,
      sampleCount: Number(form.sampleCount),
      averageWeightG,
      survivalRatePct: form.survivalRatePct ? Number(form.survivalRatePct) : undefined,
      estimatedBiomass: form.estimatedBiomass ? Number(form.estimatedBiomass) : undefined,
    });

    setForm({
      measuredAt: todayIsoDate(),
      sampleCount: '',
      weightInput: '',
      survivalRatePct: '',
      estimatedBiomass: '',
    });
    setEntryUnit(isBercario ? 'pl_per_gram' : 'grams');
  };

  const weightLabel = entryUnit === 'pl_per_gram' ? 'PL/grama' : 'Peso médio (g)';
  const weightStep = entryUnit === 'pl_per_gram' ? '1' : isBercario ? '0.0001' : '0.01';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Nova leitura — ${pondCode}`}
      width={500}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Registre os dados coletados no viveiro para atualizar a biometria.
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            label="Data"
            type="date"
            value={form.measuredAt}
            onChange={(e) => setForm((current) => ({ ...current, measuredAt: e.target.value }))}
          />
          <Input
            label="Amostras"
            type="number"
            value={form.sampleCount}
            onChange={(e) => setForm((current) => ({ ...current, sampleCount: e.target.value }))}
            placeholder="Ex: 15"
          />
          {isBercario && (
            <div role="group" aria-label="Unidade de entrada" style={{ display: 'flex', gap: 8 }}>
              {(
                [
                  { unit: 'pl_per_gram' as const, label: 'PL/g' },
                  { unit: 'grams' as const, label: 'Peso (g)' },
                ]
              ).map(({ unit, label }) => {
                const selected = entryUnit === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit)}
                    aria-pressed={selected}
                    style={{
                      padding: '5px 10px',
                      borderRadius: radius.pill,
                      backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
                      border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      color: selected ? 'var(--accent-dark)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: selected ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <Input
            label={weightLabel}
            type="number"
            step={weightStep}
            value={form.weightInput}
            onChange={(e) => setForm((current) => ({ ...current, weightInput: e.target.value }))}
            placeholder={entryUnit === 'pl_per_gram' ? 'Pós-larvas por grama' : 'Ex: 12.50'}
          />
          <Input
            label="Sobrevivência (%)"
            type="number"
            step="0.01"
            value={form.survivalRatePct}
            onChange={(e) => setForm((current) => ({ ...current, survivalRatePct: e.target.value }))}
            placeholder="Ex: 95.50 (opcional)"
          />
          <Input
            label="Biomassa (kg) opcional"
            type="number"
            step="0.01"
            value={form.estimatedBiomass}
            onChange={(e) => setForm((current) => ({ ...current, estimatedBiomass: e.target.value }))}
            placeholder="Ex: 1250.00"
          />
        </div>

        {disabledReason && (
          <div style={{ color: 'var(--danger)', fontSize: 13 }}>{disabledReason}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={handleSave}
            disabled={!form.sampleCount || !form.weightInput || !!disabledReason}
          >
            Salvar leitura
          </Button>
        </div>
      </div>
    </Modal>
  );
}
