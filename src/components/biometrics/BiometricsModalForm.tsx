import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
    averageWeightG: '',
    survivalRatePct: '',
    estimatedBiomass: '',
  });

  const handleSave = () => {
    if (!form.measuredAt || !form.sampleCount || !form.averageWeightG) return;

    onSubmit({
      measuredAt: form.measuredAt,
      sampleCount: Number(form.sampleCount),
      averageWeightG: Number(form.averageWeightG),
      survivalRatePct: form.survivalRatePct ? Number(form.survivalRatePct) : undefined,
      estimatedBiomass: form.estimatedBiomass ? Number(form.estimatedBiomass) : undefined,
    });

    setForm({
      measuredAt: todayIsoDate(),
      sampleCount: '',
      averageWeightG: '',
      survivalRatePct: '',
      estimatedBiomass: '',
    });
  };

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
          <Input
            label={isBercario ? 'PL/grama' : 'Peso médio (g)'}
            type="number"
            step={isBercario ? '1' : '0.01'}
            value={form.averageWeightG}
            onChange={(e) => setForm((current) => ({ ...current, averageWeightG: e.target.value }))}
            placeholder={isBercario ? 'Pós-larvas por grama' : 'Ex: 12.50'}
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
            disabled={!form.sampleCount || !form.averageWeightG || !!disabledReason}
          >
            Salvar leitura
          </Button>
        </div>
      </div>
    </Modal>
  );
}
